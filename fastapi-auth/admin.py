from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from auth import get_admin_user
from database import get_db
from models import User, Post, Like, Comment
from schemas import (
    AdminUserActionResponse,
    AdminUsersResponse,
    AdminPostActionResponse,
    AdminPostsResponse,
)


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


# ==========================
# Post Response Helper
# ==========================

def build_admin_post_response(
    db: Session,
    post: Post,
):
    """
    Build one post response with calculated likes,
    comments and reshare counts.
    """

    likes_count = (
        db.query(func.count(Like.id))
        .filter(Like.post_id == post.id)
        .scalar()
        or 0
    )

    comments_count = (
        db.query(func.count(Comment.id))
        .filter(
            Comment.post_id == post.id,
            Comment.is_deleted.is_(False),
        )
        .scalar()
        or 0
    )

    reshare_count = (
        db.query(func.count(Post.id))
        .filter(
            Post.original_post_id == post.id,
            Post.is_deleted.is_(False),
        )
        .scalar()
        or 0
    )

    return {
        "id": post.id,
        "content": post.content,
        "author_id": post.author_id,
        "author": post.author,
        "is_archived": post.is_archived,
        "is_deleted": post.is_deleted,
        "original_post_id": post.original_post_id,
        "created_at": post.created_at,
        "updated_at": post.updated_at,
        "media": post.media,
        "likes_count": likes_count,
        "comments_count": comments_count,
        "reshare_count": reshare_count,
    }


# ==========================
# Admin Dashboard Statistics
# ==========================

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    """
    Return statistics for the admin dashboard.
    Only admin users can access this endpoint.
    """

    total_users = (
        db.query(func.count(User.id))
        .filter(User.is_deleted.is_(False))
        .scalar()
        or 0
    )

    blocked_users = (
        db.query(func.count(User.id))
        .filter(
            User.is_deleted.is_(False),
            User.is_blocked.is_(True),
        )
        .scalar()
        or 0
    )

    total_posts = (
        db.query(func.count(Post.id))
        .filter(Post.is_deleted.is_(False))
        .scalar()
        or 0
    )

    active_posts = (
        db.query(func.count(Post.id))
        .filter(
            Post.is_deleted.is_(False),
            Post.is_archived.is_(False),
        )
        .scalar()
        or 0
    )

    archived_posts = (
        db.query(func.count(Post.id))
        .filter(
            Post.is_deleted.is_(False),
            Post.is_archived.is_(True),
        )
        .scalar()
        or 0
    )

    total_likes = (
        db.query(func.count(Like.id))
        .scalar()
        or 0
    )

    total_comments = (
        db.query(func.count(Comment.id))
        .filter(Comment.is_deleted.is_(False))
        .scalar()
        or 0
    )

    return {
        "users": {
            "total": total_users,
            "blocked": blocked_users,
        },
        "posts": {
            "total": total_posts,
            "active": active_posts,
            "archived": archived_posts,
        },
        "engagement": {
            "likes": total_likes,
            "comments": total_comments,
        },
    }


# ==========================
# Get All Users
# ==========================

@router.get(
    "/users",
    response_model=AdminUsersResponse,
)
def get_admin_users(
    search: str | None = Query(
        default=None,
        max_length=100,
    ),
    status_filter: str | None = Query(
        default=None,
        alias="status",
        pattern="^(active|blocked|deleted)$",
    ),
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
    current_admin: User = Depends(get_admin_user),
):
    """
    Return a paginated list of users.

    Supported filters:

    - search by username, email or name
    - active users
    - blocked users
    - deleted users
    """

    query = db.query(User)

    if search:
        cleaned_search = search.strip()

        if cleaned_search:
            search_value = f"%{cleaned_search}%"

            query = query.filter(
                or_(
                    User.username.ilike(search_value),
                    User.email.ilike(search_value),
                    User.name.ilike(search_value),
                )
            )

    if status_filter == "active":
        query = query.filter(
            User.is_deleted.is_(False),
            User.is_blocked.is_(False),
        )

    elif status_filter == "blocked":
        query = query.filter(
            User.is_deleted.is_(False),
            User.is_blocked.is_(True),
        )

    elif status_filter == "deleted":
        query = query.filter(
            User.is_deleted.is_(True),
        )

    else:
        query = query.filter(
            User.is_deleted.is_(False),
        )

    total = query.count()

    users = (
        query
        .order_by(
            User.created_at.desc(),
            User.id.desc(),
        )
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "users": users,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": offset + len(users) < total,
    }


# ==========================
# Block User
# ==========================

@router.patch(
    "/users/{user_id}/block",
    response_model=AdminUserActionResponse,
)
def block_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A deleted user cannot be blocked.",
        )

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot block your own admin account.",
        )

    if user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Another admin account cannot be blocked.",
        )

    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already blocked.",
        )

    user.is_blocked = True
    user.blocked_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    return {
        "message": "User blocked successfully.",
        "user": user,
    }


# ==========================
# Unblock User
# ==========================

@router.patch(
    "/users/{user_id}/unblock",
    response_model=AdminUserActionResponse,
)
def unblock_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A deleted user cannot be unblocked.",
        )

    if not user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not blocked.",
        )

    user.is_blocked = False
    user.blocked_at = None

    db.commit()
    db.refresh(user)

    return {
        "message": "User unblocked successfully.",
        "user": user,
    }


# ==========================
# Soft Delete User
# ==========================

@router.delete(
    "/users/{user_id}",
    response_model=AdminUserActionResponse,
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own admin account.",
        )

    if user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Another admin account cannot be deleted.",
        )

    if user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already deleted.",
        )

    current_time = datetime.utcnow()

    user.is_deleted = True
    user.deleted_at = current_time
    user.is_blocked = True
    user.blocked_at = user.blocked_at or current_time

    db.commit()
    db.refresh(user)

    return {
        "message": "User deleted successfully.",
        "user": user,
    }


# ==========================
# Get All Posts
# ==========================

@router.get(
    "/posts",
    response_model=AdminPostsResponse,
)
def get_admin_posts(
    search: str | None = Query(
        default=None,
        max_length=200,
    ),
    status_filter: str | None = Query(
        default=None,
        alias="status",
        pattern="^(active|archived|deleted)$",
    ),
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
    current_admin: User = Depends(get_admin_user),
):
    """
    Return all platform posts for admin moderation.

    Search supports:

    - post content
    - author's username
    - author's email
    - author's name

    Status supports:

    - active
    - archived
    - deleted
    """

    likes_count_subquery = (
        db.query(
            Like.post_id.label("post_id"),
            func.count(Like.id).label("likes_count"),
        )
        .group_by(Like.post_id)
        .subquery()
    )

    comments_count_subquery = (
        db.query(
            Comment.post_id.label("post_id"),
            func.count(Comment.id).label("comments_count"),
        )
        .filter(Comment.is_deleted.is_(False))
        .group_by(Comment.post_id)
        .subquery()
    )

    reshare_count_subquery = (
        db.query(
            Post.original_post_id.label("post_id"),
            func.count(Post.id).label("reshare_count"),
        )
        .filter(
            Post.original_post_id.is_not(None),
            Post.is_deleted.is_(False),
        )
        .group_by(Post.original_post_id)
        .subquery()
    )

    query = (
        db.query(
            Post,
            func.coalesce(
                likes_count_subquery.c.likes_count,
                0,
            ).label("likes_count"),
            func.coalesce(
                comments_count_subquery.c.comments_count,
                0,
            ).label("comments_count"),
            func.coalesce(
                reshare_count_subquery.c.reshare_count,
                0,
            ).label("reshare_count"),
        )
        .join(
            User,
            User.id == Post.author_id,
        )
        .outerjoin(
            likes_count_subquery,
            likes_count_subquery.c.post_id == Post.id,
        )
        .outerjoin(
            comments_count_subquery,
            comments_count_subquery.c.post_id == Post.id,
        )
        .outerjoin(
            reshare_count_subquery,
            reshare_count_subquery.c.post_id == Post.id,
        )
        .options(
            selectinload(Post.author),
            selectinload(Post.media),
        )
    )

    if search:
        cleaned_search = search.strip()

        if cleaned_search:
            search_value = f"%{cleaned_search}%"

            query = query.filter(
                or_(
                    Post.content.ilike(search_value),
                    User.username.ilike(search_value),
                    User.email.ilike(search_value),
                    User.name.ilike(search_value),
                )
            )

    if status_filter == "active":
        query = query.filter(
            Post.is_deleted.is_(False),
            Post.is_archived.is_(False),
        )

    elif status_filter == "archived":
        query = query.filter(
            Post.is_deleted.is_(False),
            Post.is_archived.is_(True),
        )

    elif status_filter == "deleted":
        query = query.filter(
            Post.is_deleted.is_(True),
        )

    else:
        query = query.filter(
            Post.is_deleted.is_(False),
        )

    total = query.count()

    post_records = (
        query
        .order_by(
            Post.created_at.desc(),
            Post.id.desc(),
        )
        .offset(offset)
        .limit(limit)
        .all()
    )

    posts = []

    for (
        post,
        likes_count,
        comments_count,
        reshare_count,
    ) in post_records:
        posts.append(
            {
                "id": post.id,
                "content": post.content,
                "author_id": post.author_id,
                "author": post.author,
                "is_archived": post.is_archived,
                "is_deleted": post.is_deleted,
                "original_post_id": post.original_post_id,
                "created_at": post.created_at,
                "updated_at": post.updated_at,
                "media": post.media,
                "likes_count": likes_count,
                "comments_count": comments_count,
                "reshare_count": reshare_count,
            }
        )

    return {
        "posts": posts,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": offset + len(posts) < total,
    }


# ==========================
# Archive Post
# ==========================

@router.patch(
    "/posts/{post_id}/archive",
    response_model=AdminPostActionResponse,
)
def archive_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    post = (
        db.query(Post)
        .options(
            selectinload(Post.author),
            selectinload(Post.media),
        )
        .filter(Post.id == post_id)
        .first()
    )

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    if post.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A deleted post cannot be archived.",
        )

    if post.is_archived:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post is already archived.",
        )

    post.is_archived = True

    db.commit()
    db.refresh(post)

    return {
        "message": "Post archived successfully.",
        "post": build_admin_post_response(
            db=db,
            post=post,
        ),
    }


# ==========================
# Unarchive Post
# ==========================

@router.patch(
    "/posts/{post_id}/unarchive",
    response_model=AdminPostActionResponse,
)
def unarchive_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    post = (
        db.query(Post)
        .options(
            selectinload(Post.author),
            selectinload(Post.media),
        )
        .filter(Post.id == post_id)
        .first()
    )

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    if post.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A deleted post cannot be unarchived.",
        )

    if not post.is_archived:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post is not archived.",
        )

    post.is_archived = False

    db.commit()
    db.refresh(post)

    return {
        "message": "Post unarchived successfully.",
        "post": build_admin_post_response(
            db=db,
            post=post,
        ),
    }


# ==========================
# Soft Delete Post
# ==========================

@router.delete(
    "/posts/{post_id}",
    response_model=AdminPostActionResponse,
)
def delete_post_by_admin(
    post_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    post = (
        db.query(Post)
        .options(
            selectinload(Post.author),
            selectinload(Post.media),
        )
        .filter(Post.id == post_id)
        .first()
    )

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found.",
        )

    if post.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post is already deleted.",
        )

    post.is_deleted = True

    db.commit()
    db.refresh(post)

    return {
        "message": "Post deleted successfully.",
        "post": build_admin_post_response(
            db=db,
            post=post,
        ),
    }