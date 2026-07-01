from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, selectinload
from typing import Optional, List

from database import get_db
from models import Post, User, PostMedia
from schemas import PostUpdate, PostResponse
from auth import get_current_user
from services.s3_service import upload_file_to_s3

router = APIRouter(prefix="/posts", tags=["Posts"])


def post_query_with_relations(db: Session):
    return db.query(Post).options(
        selectinload(Post.media),
        selectinload(Post.author)
    )


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

    if original_post_id:
        original_post = db.query(Post).filter(
            Post.id == original_post_id,
            Post.is_deleted == False
        ).first()

        if not original_post:
            raise HTTPException(status_code=404, detail="Original post not found")

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

            file_url_lower = file_url.lower()

            file_type = "file"

            if file_url_lower.endswith((".jpg", ".jpeg", ".png", ".gif", ".webp")):
                file_type = "image"
            elif file_url_lower.endswith((".mp4", ".mov", ".webm")):
                file_type = "video"

            post_media = PostMedia(
                post_id=new_post.id,
                file_url=file_url,
                file_type=file_type
            )

            db.add(post_media)

        db.commit()

    post_with_relations = post_query_with_relations(db).filter(
        Post.id == new_post.id
    ).first()

    return post_with_relations


@router.get("/", response_model=list[PostResponse])
def get_feed_posts(db: Session = Depends(get_db)):
    posts = post_query_with_relations(db).filter(
        Post.is_deleted == False,
        Post.is_archived == False
    ).order_by(Post.created_at.desc()).all()

    return posts


@router.get("/my-posts", response_model=list[PostResponse])
def get_my_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    posts = post_query_with_relations(db).filter(
        Post.author_id == current_user.id,
        Post.is_deleted == False
    ).order_by(Post.created_at.desc()).all()

    return posts


@router.get("/{post_id}", response_model=PostResponse)
def get_single_post(post_id: int, db: Session = Depends(get_db)):
    post = post_query_with_relations(db).filter(
        Post.id == post_id,
        Post.is_deleted == False
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return post


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

    return updated_post


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

    return updated_post


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

    return updated_post


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
        raise HTTPException(status_code=404, detail="Post not found")

    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own post")

    post.is_deleted = True

    db.commit()

    return {"message": "Post deleted successfully"}
