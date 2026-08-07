from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session, aliased

from database import get_db
from models import Follow, Friendship, User
from auth import get_current_user
from schemas import (
    DiscoverUserResponse,
    DiscoverUsersResponse,
    FollowActionResponse,
    FollowStatusResponse,
    FollowListResponse,
    FollowListItemResponse,
    PublicUserResponse,
)


router = APIRouter(
    prefix="/users",
    tags=["Follow System"],
)


# ==========================
# Helper: Friendship Info
# ==========================

def get_friendship_info(
    db: Session,
    current_user_id: int,
    other_user_id: int,
):
    """
    Return (friendship_status, is_friend) between two users.

    friendship_status is one of:
    none | pending_sent | pending_received | accepted | rejected
    """

    if current_user_id == other_user_id:
        return "none", False

    relationship = (
        db.query(Friendship)
        .filter(
            or_(
                and_(
                    Friendship.sender_id == current_user_id,
                    Friendship.receiver_id == other_user_id,
                ),
                and_(
                    Friendship.sender_id == other_user_id,
                    Friendship.receiver_id == current_user_id,
                ),
            )
        )
        .first()
    )

    if not relationship:
        return "none", False

    if relationship.status == "accepted":
        return "accepted", True

    if relationship.status == "pending":
        if relationship.sender_id == current_user_id:
            return "pending_sent", False
        else:
            return "pending_received", False

    return relationship.status, False


# ==========================
# Discover Users
# ==========================

@router.get(
    "",
    response_model=DiscoverUsersResponse,
)
def get_all_users(
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all users except the currently logged-in user.

    The response also includes:

    - Whether the current user follows each user
    - Whether each user follows the current user
    - Each user's followers count
    - The friendship status and is_friend flag between the
      current user and each listed user
    - Pagination information
    """

    total = (
        db.query(User)
        .filter(User.id != current_user.id)
        .count()
    )

    # Count how many followers each user has.
    followers_count_subquery = (
        db.query(
            Follow.following_id.label("user_id"),
            func.count(Follow.id).label(
                "followers_count"
            ),
        )
        .group_by(Follow.following_id)
        .subquery()
    )

    # Relationship:
    # Current logged-in user follows listed user.
    current_user_follow = aliased(Follow)

    # Reverse relationship:
    # Listed user follows current logged-in user.
    reverse_follow = aliased(Follow)

    user_records = (
        db.query(
            User,
            func.coalesce(
                followers_count_subquery.c.followers_count,
                0,
            ).label("followers_count"),
            current_user_follow.id.label(
                "follow_relationship_id"
            ),
            reverse_follow.id.label(
                "reverse_follow_relationship_id"
            ),
        )
        .outerjoin(
            followers_count_subquery,
            followers_count_subquery.c.user_id
            == User.id,
        )
        .outerjoin(
            current_user_follow,
            and_(
                current_user_follow.follower_id
                == current_user.id,
                current_user_follow.following_id
                == User.id,
            ),
        )
        .outerjoin(
            reverse_follow,
            and_(
                reverse_follow.follower_id
                == User.id,
                reverse_follow.following_id
                == current_user.id,
            ),
        )
        .filter(User.id != current_user.id)
        .order_by(User.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    users = []

    for (
        user,
        followers_count,
        follow_relationship_id,
        reverse_follow_relationship_id,
    ) in user_records:
        friendship_status, is_friend = get_friendship_info(
            db=db,
            current_user_id=current_user.id,
            other_user_id=user.id,
        )

        users.append(
            DiscoverUserResponse(
                id=user.id,
                username=user.username,
                name=user.name,
                profile_picture=user.profile_picture,
                bio=user.bio,
                is_following=(
                    follow_relationship_id is not None
                ),
                follows_you=(
                    reverse_follow_relationship_id
                    is not None
                ),
                followers_count=followers_count,
                friendship_status=friendship_status,
                is_friend=is_friend,
            )
        )

    return DiscoverUsersResponse(
        users=users,
        total=total,
        limit=limit,
        offset=offset,
        has_more=offset + len(users) < total,
    )


# ==========================
# Suggested Users
# ==========================

@router.get(
    "/suggestions",
    response_model=DiscoverUsersResponse,
)
def get_suggested_users(
    limit: int = Query(
        default=5,
        ge=1,
        le=50,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return a random selection of users to suggest to the current
    user, excluding the current user and users they are already
    friends with (accepted friendships).
    """

    accepted_friendships = (
        db.query(Friendship)
        .filter(
            Friendship.status == "accepted",
            or_(
                Friendship.sender_id == current_user.id,
                Friendship.receiver_id == current_user.id,
            ),
        )
        .all()
    )

    friend_ids = set()

    for friendship in accepted_friendships:
        other_id = (
            friendship.receiver_id
            if friendship.sender_id == current_user.id
            else friendship.sender_id
        )
        friend_ids.add(other_id)

    candidates_query = db.query(User).filter(
        User.id != current_user.id
    )

    if friend_ids:
        candidates_query = candidates_query.filter(
            ~User.id.in_(friend_ids)
        )

    # NOTE: func.random() works on PostgreSQL and SQLite.
    # If the project uses MySQL, replace with func.rand().
    candidates = (
        candidates_query
        .order_by(func.random())
        .limit(limit)
        .all()
    )

    candidate_ids = [user.id for user in candidates]

    # ----------------------------------
    # Batch: followers_count per candidate
    # ----------------------------------
    followers_count_map = {}

    if candidate_ids:
        followers_count_rows = (
            db.query(
                Follow.following_id,
                func.count(Follow.id),
            )
            .filter(Follow.following_id.in_(candidate_ids))
            .group_by(Follow.following_id)
            .all()
        )

        followers_count_map = dict(followers_count_rows)

    # ----------------------------------
    # Batch: which candidates does the
    # current user already follow?
    # ----------------------------------
    following_ids = set()

    if candidate_ids:
        following_rows = (
            db.query(Follow.following_id)
            .filter(
                Follow.follower_id == current_user.id,
                Follow.following_id.in_(candidate_ids),
            )
            .all()
        )

        following_ids = {row[0] for row in following_rows}

    # ----------------------------------
    # Batch: which candidates already
    # follow the current user back?
    # ----------------------------------
    follows_you_ids = set()

    if candidate_ids:
        follows_you_rows = (
            db.query(Follow.follower_id)
            .filter(
                Follow.follower_id.in_(candidate_ids),
                Follow.following_id == current_user.id,
            )
            .all()
        )

        follows_you_ids = {row[0] for row in follows_you_rows}

    # ----------------------------------
    # Batch: friendship status against
    # each candidate
    # ----------------------------------
    friendship_map = {}

    if candidate_ids:
        friendship_rows = (
            db.query(Friendship)
            .filter(
                or_(
                    and_(
                        Friendship.sender_id == current_user.id,
                        Friendship.receiver_id.in_(candidate_ids),
                    ),
                    and_(
                        Friendship.receiver_id == current_user.id,
                        Friendship.sender_id.in_(candidate_ids),
                    ),
                )
            )
            .all()
        )

        for friendship in friendship_rows:
            other_id = (
                friendship.receiver_id
                if friendship.sender_id == current_user.id
                else friendship.sender_id
            )

            if friendship.status == "accepted":
                friendship_map[other_id] = ("accepted", True)
            elif friendship.status == "pending":
                if friendship.sender_id == current_user.id:
                    friendship_map[other_id] = ("pending_sent", False)
                else:
                    friendship_map[other_id] = ("pending_received", False)
            else:
                friendship_map[other_id] = (friendship.status, False)

    users = []

    for user in candidates:
        friendship_status, is_friend = friendship_map.get(
            user.id, ("none", False)
        )

        users.append(
            DiscoverUserResponse(
                id=user.id,
                username=user.username,
                name=user.name,
                profile_picture=user.profile_picture,
                bio=user.bio,
                is_following=user.id in following_ids,
                follows_you=user.id in follows_you_ids,
                followers_count=followers_count_map.get(user.id, 0),
                friendship_status=friendship_status,
                is_friend=is_friend,
            )
        )

    return DiscoverUsersResponse(
        users=users,
        total=len(users),
        limit=limit,
        offset=0,
        has_more=False,
    )


# ==========================
# Follow User
# ==========================

@router.post(
    "/{user_id}/follow",
    response_model=FollowActionResponse,
    status_code=status.HTTP_201_CREATED,
)
def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # User cannot follow themselves.
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself",
        )

    # Check whether target user exists.
    target_user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check whether current user already follows target user.
    existing_follow = (
        db.query(Follow)
        .filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == user_id,
        )
        .first()
    )

    if existing_follow:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already follow this user",
        )

    new_follow = Follow(
        follower_id=current_user.id,
        following_id=user_id,
    )

    db.add(new_follow)
    db.commit()
    db.refresh(new_follow)

    followers_count = (
        db.query(Follow)
        .filter(Follow.following_id == user_id)
        .count()
    )

    return FollowActionResponse(
        message="User followed successfully",
        is_following=True,
        followers_count=followers_count,
    )


# ==========================
# Unfollow User
# ==========================

@router.delete(
    "/{user_id}/follow",
    response_model=FollowActionResponse,
)
def unfollow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot unfollow yourself",
        )

    target_user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    follow_relationship = (
        db.query(Follow)
        .filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == user_id,
        )
        .first()
    )

    if not follow_relationship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not following this user",
        )

    db.delete(follow_relationship)
    db.commit()

    followers_count = (
        db.query(Follow)
        .filter(Follow.following_id == user_id)
        .count()
    )

    return FollowActionResponse(
        message="User unfollowed successfully",
        is_following=False,
        followers_count=followers_count,
    )


# ==========================
# Follow Status
# ==========================

@router.get(
    "/{user_id}/follow-status",
    response_model=FollowStatusResponse,
)
def get_follow_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Does the current user follow the target user?
    follow_relationship = (
        db.query(Follow)
        .filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == user_id,
        )
        .first()
    )

    # Does the target user follow the current user?
    reverse_follow_relationship = (
        db.query(Follow)
        .filter(
            Follow.follower_id == user_id,
            Follow.following_id == current_user.id,
        )
        .first()
    )

    followers_count = (
        db.query(Follow)
        .filter(Follow.following_id == user_id)
        .count()
    )

    following_count = (
        db.query(Follow)
        .filter(Follow.follower_id == user_id)
        .count()
    )

    return FollowStatusResponse(
        user_id=user_id,
        is_following=follow_relationship is not None,
        follows_you=(
            reverse_follow_relationship is not None
        ),
        followers_count=followers_count,
        following_count=following_count,
    )


# ==========================
# Followers List
# ==========================

@router.get(
    "/{user_id}/followers",
    response_model=FollowListResponse,
)
def get_followers(
    user_id: int,
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    total = (
        db.query(Follow)
        .filter(Follow.following_id == user_id)
        .count()
    )

    follower_records = (
        db.query(Follow, User)
        .join(
            User,
            User.id == Follow.follower_id,
        )
        .filter(Follow.following_id == user_id)
        .order_by(Follow.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    users = []

    for follow_record, user in follower_records:
        users.append(
            FollowListItemResponse(
                relationship_id=follow_record.id,
                followed_at=follow_record.created_at,
                user=PublicUserResponse(
                    id=user.id,
                    username=user.username,
                    name=user.name,
                    profile_picture=user.profile_picture,
                    bio=user.bio,
                ),
            )
        )

    return FollowListResponse(
        users=users,
        total=total,
        limit=limit,
        offset=offset,
        has_more=offset + len(users) < total,
    )


# ==========================
# Following List
# ==========================

@router.get(
    "/{user_id}/following",
    response_model=FollowListResponse,
)
def get_following(
    user_id: int,
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    total = (
        db.query(Follow)
        .filter(Follow.follower_id == user_id)
        .count()
    )

    following_records = (
        db.query(Follow, User)
        .join(
            User,
            User.id == Follow.following_id,
        )
        .filter(Follow.follower_id == user_id)
        .order_by(Follow.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    users = []

    for follow_record, user in following_records:
        users.append(
            FollowListItemResponse(
                relationship_id=follow_record.id,
                followed_at=follow_record.created_at,
                user=PublicUserResponse(
                    id=user.id,
                    username=user.username,
                    name=user.name,
                    profile_picture=user.profile_picture,
                    bio=user.bio,
                ),
            )
        )

    return FollowListResponse(
        users=users,
        total=total,
        limit=limit,
        offset=offset,
        has_more=offset + len(users) < total,
    )