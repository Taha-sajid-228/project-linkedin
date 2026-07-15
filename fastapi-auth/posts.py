from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, selectinload
from typing import Optional, List

from database import get_db
from models import Post, User, PostMedia, Like, Comment
from schemas import PostUpdate, PostResponse, UserResponse
from auth import get_current_user
from services.s3_service import upload_file_to_s3

router = APIRouter(prefix="/posts", tags=["Posts"])


ALLOWED_MEDIA_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
]


def validate_media_file(file: UploadFile):
    if file.content_type not in ALLOWED_MEDIA_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only image and video files are allowed"
        )


def get_file_type(content_type: str):
    if content_type.startswith("image/"):
        return "image"

    if content_type.startswith("video/"):
        return "video"

    return "file"


def post_query_with_relations(db: Session):
    return db.query(Post).options(
        selectinload(Post.media),
        selectinload(Post.author),
        selectinload(Post.likes),
        selectinload(Post.original_post).selectinload(Post.author),
        selectinload(Post.original_post).selectinload(Post.media),
        selectinload(Post.original_post).selectinload(Post.likes),
    )


def add_post_info(post: Post, current_user: User, db: Session):
    post.likes_count = len(post.likes)
    post.is_liked_by_me = any(like.user_id == current_user.id for like in post.likes)

    post.comments_count = db.query(Comment).filter(
        Comment.post_id == post.id,
        Comment.is_deleted == False
    ).count()

    post.reshare_count = db.query(Post).filter(
        Post.original_post_id == post.id,
        Post.is_deleted == False
    ).count()

    if post.original_post:
        post.original_post.likes_count = len(post.original_post.likes)
        post.original_post.is_liked_by_me = any(
            like.user_id == current_user.id for like in post.original_post.likes
        )

        post.original_post.comments_count = db.query(Comment).filter(
            Comment.post_id == post.original_post.id,
            Comment.is_deleted == False
        ).count()

        post.original_post.reshare_count = db.query(Post).filter(
            Post.original_post_id == post.original_post.id,
            Post.is_deleted == False
        ).count()

    return post


def add_post_info_to_posts(posts: list[Post], current_user: User, db: Session):
    for post in posts:
        add_post_info(post, current_user, db)
    return posts


@router.post("/", response_model=PostResponse)
def create_post(
    content: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    original_post_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not content and not files and not original_post_id:
        raise HTTPException(
            status_code=400,
            detail="Post must have content, files, or original post"
        )

    if files:
        for file in files:
            validate_media_file(file)

    if original_post_id:
        original_post = db.query(Post).filter(
            Post.id == original_post_id,
            Post.is_deleted == False,
            Post.is_archived == False
        ).first()

        if not original_post:
            raise HTTPException(status_code=404, detail="Original post not found")

        if original_post.author_id == current_user.id:
            raise HTTPException(
                status_code=400,
                detail="You cannot share your own post"
            )

        if original_post.original_post_id:
            original_post_id = original_post.original_post_id

    new_post = Post(
        content=content,
        original_post_id=original_post_id,
        author_id=current_user.id
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    if files:
        for file in files:
            file_url = upload_file_to_s3(file, "posts")

            post_media = PostMedia(
                post_id=new_post.id,
                file_url=file_url,
                file_type=get_file_type(file.content_type)
            )

            db.add(post_media)

        db.commit()

    post_with_relations = post_query_with_relations(db).filter(
        Post.id == new_post.id
    ).first()

    return add_post_info(post_with_relations, current_user, db)


@router.get("/", response_model=list[PostResponse])
def get_feed_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    posts = post_query_with_relations(db).filter(
        Post.is_deleted == False,
        Post.is_archived == False
    ).order_by(Post.created_at.desc()).all()

    return add_post_info_to_posts(posts, current_user, db)


@router.get("/my-posts", response_model=list[PostResponse])
def get_my_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    posts = post_query_with_relations(db).filter(
        Post.author_id == current_user.id,
        Post.is_deleted == False
    ).order_by(Post.created_at.desc()).all()

    return add_post_info_to_posts(posts, current_user, db)


@router.get("/user/{user_id}", response_model=list[PostResponse])
def get_user_posts(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    posts = post_query_with_relations(db).filter(
        Post.author_id == user_id,
        Post.is_deleted == False,
        Post.is_archived == False
    ).order_by(Post.created_at.desc()).all()

    return add_post_info_to_posts(posts, current_user, db)


@router.post("/{post_id}/like")
def toggle_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.is_deleted == False
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_like = db.query(Like).filter(
        Like.user_id == current_user.id,
        Like.post_id == post_id
    ).first()

    if existing_like:
        db.delete(existing_like)
        db.commit()

        likes_count = db.query(Like).filter(
            Like.post_id == post_id
        ).count()

        return {
            "message": "Post unliked successfully",
            "liked": False,
            "likes_count": likes_count
        }

    new_like = Like(
        user_id=current_user.id,
        post_id=post_id
    )

    db.add(new_like)
    db.commit()

    likes_count = db.query(Like).filter(
        Like.post_id == post_id
    ).count()

    return {
        "message": "Post liked successfully",
        "liked": True,
        "likes_count": likes_count
    }


@router.get("/{post_id}/likes", response_model=List[UserResponse])
def get_post_likes(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.is_deleted == False
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    users = db.query(User).join(Like, Like.user_id == User.id).filter(
        Like.post_id == post_id
    ).all()

    return users


@router.get("/{post_id}", response_model=PostResponse)
def get_single_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = post_query_with_relations(db).filter(
        Post.id == post_id,
        Post.is_deleted == False
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return add_post_info(post, current_user, db)


@router.put("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    post_data: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = post_query_with_relations(db).filter(
        Post.id == post_id,
        Post.is_deleted == False
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own post")

    if post_data.content is not None:
        post.content = post_data.content

    if post_data.is_archived is not None:
        post.is_archived = post_data.is_archived

    db.commit()
    db.refresh(post)

    updated_post = post_query_with_relations(db).filter(
        Post.id == post.id
    ).first()

    return add_post_info(updated_post, current_user, db)


@router.patch("/{post_id}/archive", response_model=PostResponse)
def archive_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = post_query_with_relations(db).filter(
        Post.id == post_id,
        Post.is_deleted == False
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only archive your own post")

    post.is_archived = True

    db.commit()
    db.refresh(post)

    updated_post = post_query_with_relations(db).filter(
        Post.id == post.id
    ).first()

    return add_post_info(updated_post, current_user, db)


@router.patch("/{post_id}/unarchive", response_model=PostResponse)
def unarchive_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = post_query_with_relations(db).filter(
        Post.id == post_id,
        Post.is_deleted == False
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only unarchive your own post")

    post.is_archived = False

    db.commit()
    db.refresh(post)

    updated_post = post_query_with_relations(db).filter(
        Post.id == post.id
    ).first()

    return add_post_info(updated_post, current_user, db)


@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.is_deleted == False
    ).first()

    if not post:
        raise HTTPException(
            status_code=404,
            detail="Post not found"
        )

    if post.author_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own post"
        )

    # Soft-delete the selected post.
    post.is_deleted = True

    deleted_reposts_count = 0

    # If the deleted post is an original post,
    # soft-delete all reposts connected to it.
    if post.original_post_id is None:
        deleted_reposts_count = db.query(Post).filter(
            Post.original_post_id == post.id,
            Post.is_deleted == False
        ).update(
            {
                Post.is_deleted: True
            },
            synchronize_session=False
        )

    db.commit()

    if deleted_reposts_count > 0:
        return {
            "message": "Post and its reposts deleted successfully",
            "deleted_reposts_count": deleted_reposts_count
        }

    return {
        "message": "Post deleted successfully"
    }