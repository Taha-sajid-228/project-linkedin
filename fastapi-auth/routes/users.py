from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db
from auth import get_current_user
from models import User, Friendship


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/suggestions")
def get_user_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print("========== SUGGESTIONS ROUTE HIT ==========")
    print("CURRENT USER:", current_user)

    users = (
        db.query(User)
        .filter(
            User.id != current_user.id,
            User.is_deleted == False
        )
        .limit(5)
        .all()
    )

    print("USERS FOUND:", users)

    suggestions = []

    for user in users:

        print("CHECKING USER:", user.id, user.username)

        friendship = (
            db.query(Friendship)
            .filter(
                or_(
                    (
                        Friendship.sender_id == current_user.id
                    ) &
                    (
                        Friendship.receiver_id == user.id
                    ),
                    (
                        Friendship.sender_id == user.id
                    ) &
                    (
                        Friendship.receiver_id == current_user.id
                    )
                )
            )
            .first()
        )

        print("FRIENDSHIP:", friendship)

        status = "none"

        if friendship:
            if friendship.status == "accepted":
                status = "accepted"

            elif friendship.status == "pending":
                if friendship.sender_id == current_user.id:
                    status = "pending_sent"
                else:
                    status = "pending_received"


        suggestions.append(
            {
                "id": user.id,
                "username": user.username,
                "name": user.name,
                "profile_picture": user.profile_picture,
                "bio": user.bio,
                "friendship_status": status
            }
        )

    print("FINAL RESPONSE:", suggestions)

    return suggestions