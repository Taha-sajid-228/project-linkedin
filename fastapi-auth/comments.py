from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import Post, Comment, User
from schemas import CommentCreate, CommentUpdate, CommentResponse
from auth import get_current_user

router = APIRouter(prefix="/comments", tags=["Comments"])


@router.post("/posts/{post_id}", response_model=CommentResponse)
def create_comment(
    post_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.is_deleted == False
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = Comment(
        content=comment_data.content,
        post_id=post_id,
        author_id=current_user.id
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    comment = db.query(Comment).options(
        selectinload(Comment.author)
    ).filter(
        Comment.id == comment.id
    ).first()

    return comment


@router.get("/posts/{post_id}", response_model=list[CommentResponse])
def get_post_comments(
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

    comments = db.query(Comment).options(
        selectinload(Comment.author)
    ).filter(
        Comment.post_id == post_id,
        Comment.is_deleted == False
    ).order_by(Comment.created_at.desc()).all()

    return comments


@router.put("/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).options(
        selectinload(Comment.author)
    ).filter(
        Comment.id == comment_id,
        Comment.is_deleted == False
    ).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.author_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only update your own comment"
        )

    comment.content = comment_data.content

    db.commit()
    db.refresh(comment)

    return comment


@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.is_deleted == False
    ).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.author_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own comment"
        )

    comment.is_deleted = True

    db.commit()

    return {"message": "Comment deleted successfully"}