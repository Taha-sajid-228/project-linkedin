from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func
from sqlalchemy.orm import Session, aliased

from database import get_db
from models import Follow, User
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
    - Whether the current user follows each listed user
    - Each listed user's followers count
    - Pagination information
    """

    total = (
        db.query(User)
        .filter(User.id != current_user.id)
        .count()
    )

    followers_count_subquery = (
        db.query(
            Follow.following_id.label("user_id"),
            func.count(Follow.id).label("followers_count"),
        )
        .group_by(Follow.following_id)
        .subquery()
    )

    current_user_follow = aliased(Follow)

    user_records = (
        db.query(
            User,
            func.coalesce(
                followers_count_subquery.c.followers_count,
                0,
            ).label("followers_count"),
            current_user_follow.id.label("follow_relationship_id"),
        )
        .outerjoin(
            followers_count_subquery,
            followers_count_subquery.c.user_id == User.id,
        )
        .outerjoin(
            current_user_follow,
            and_(
                current_user_follow.follower_id == current_user.id,
                current_user_follow.following_id == User.id,
            ),
        )
        .filter(User.id != current_user.id)
        .order_by(User.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    users = []

    for user, followers_count, follow_relationship_id in user_records:
        users.append(
            DiscoverUserResponse(
                id=user.id,
                username=user.username,
                name=user.name,
                profile_picture=user.profile_picture,
                bio=user.bio,
                is_following=follow_relationship_id is not None,
                followers_count=followers_count,
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

    follow_relationship = (
        db.query(Follow)
        .filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == user_id,
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
        has_more=offset + len(users) < total,)