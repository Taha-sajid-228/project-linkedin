from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from auth import get_current_user
from database import get_db
from models import Friendship, User
from schemas import (
    FriendListItemResponse,
    FriendRequestListResponse,
    FriendsListResponse,
    FriendshipActionResponse,
    FriendshipResponse,
    PublicUserResponse,
)


router = APIRouter(
    prefix="/friends",
    tags=["Friend System"],
)


# ==========================
# Helper Functions
# ==========================

def get_relationship_between_users(
    db: Session,
    first_user_id: int,
    second_user_id: int,
):
    """
    Find a friendship record in either direction.

    Example:
    User 1 -> User 2
    or
    User 2 -> User 1
    """

    return (
        db.query(Friendship)
        .filter(
            or_(
                (
                    (Friendship.sender_id == first_user_id)
                    & (Friendship.receiver_id == second_user_id)
                ),
                (
                    (Friendship.sender_id == second_user_id)
                    & (Friendship.receiver_id == first_user_id)
                ),
            )
        )
        .first()
    )


def build_public_user(user: User) -> PublicUserResponse:
    """
    Convert a User model into a safe public-user response.
    """

    return PublicUserResponse(
        id=user.id,
        username=user.username,
        name=user.name,
        profile_picture=user.profile_picture,
        bio=user.bio,
    )


def build_friendship_response(
    friendship: Friendship,
) -> FriendshipResponse:
    """
    Convert a Friendship model into the API response format.
    """

    return FriendshipResponse(
        id=friendship.id,
        sender_id=friendship.sender_id,
        receiver_id=friendship.receiver_id,
        status=friendship.status,
        created_at=friendship.created_at,
        updated_at=friendship.updated_at,
        sender=build_public_user(friendship.sender),
        receiver=build_public_user(friendship.receiver),
    )


# ==========================
# Send Friend Request
# ==========================

@router.post(
    "/request/{user_id}",
    response_model=FriendshipActionResponse,
    status_code=status.HTTP_201_CREATED,
)
def send_friend_request(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a friend request to another user.
    """

    # User cannot send a friend request to themselves.
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot send a friend request to yourself",
        )

    # Check whether the receiver exists.
    receiver = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Search relationship in both directions.
    existing_relationship = get_relationship_between_users(
        db=db,
        first_user_id=current_user.id,
        second_user_id=user_id,
    )

    if existing_relationship:
        if existing_relationship.status == "pending":
            if existing_relationship.sender_id == current_user.id:
                detail = "Friend request already sent"
            else:
                detail = "This user has already sent you a friend request"

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=detail,
            )

        if existing_relationship.status == "accepted":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You are already friends with this user",
            )

        # A rejected relationship is reused instead of creating
        # another row. Direction is updated to the new sender.
        if existing_relationship.status == "rejected":
            existing_relationship.sender_id = current_user.id
            existing_relationship.receiver_id = user_id
            existing_relationship.status = "pending"
            existing_relationship.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(existing_relationship)

            return FriendshipActionResponse(
                message="Friend request sent successfully",
                friendship_id=existing_relationship.id,
                status=existing_relationship.status,
            )

    new_request = Friendship(
        sender_id=current_user.id,
        receiver_id=user_id,
        status="pending",
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return FriendshipActionResponse(
        message="Friend request sent successfully",
        friendship_id=new_request.id,
        status=new_request.status,
    )


# ==========================
# Received Friend Requests
# ==========================

@router.get(
    "/requests/received",
    response_model=FriendRequestListResponse,
)
def get_received_friend_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return pending friend requests received by the current user.
    """

    friend_requests = (
        db.query(Friendship)
        .options(
            joinedload(Friendship.sender),
            joinedload(Friendship.receiver),
        )
        .filter(
            Friendship.receiver_id == current_user.id,
            Friendship.status == "pending",
        )
        .order_by(Friendship.created_at.desc())
        .all()
    )

    requests = [
        build_friendship_response(friend_request)
        for friend_request in friend_requests
    ]

    return FriendRequestListResponse(
        requests=requests,
        total=len(requests),
    )


# ==========================
# Sent Friend Requests
# ==========================

@router.get(
    "/requests/sent",
    response_model=FriendRequestListResponse,
)
def get_sent_friend_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return pending friend requests sent by the current user.
    """

    friend_requests = (
        db.query(Friendship)
        .options(
            joinedload(Friendship.sender),
            joinedload(Friendship.receiver),
        )
        .filter(
            Friendship.sender_id == current_user.id,
            Friendship.status == "pending",
        )
        .order_by(Friendship.created_at.desc())
        .all()
    )

    requests = [
        build_friendship_response(friend_request)
        for friend_request in friend_requests
    ]

    return FriendRequestListResponse(
        requests=requests,
        total=len(requests),
    )


# ==========================
# Accept Friend Request
# ==========================

@router.put(
    "/requests/{request_id}/accept",
    response_model=FriendshipActionResponse,
)
def accept_friend_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Accept a pending friend request.

    Only the receiver can accept it.
    """

    friend_request = (
        db.query(Friendship)
        .filter(Friendship.id == request_id)
        .first()
    )

    if not friend_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend request not found",
        )

    if friend_request.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the receiver can accept this friend request",
        )

    if friend_request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only a pending friend request can be accepted",
        )

    friend_request.status = "accepted"
    friend_request.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(friend_request)

    return FriendshipActionResponse(
        message="Friend request accepted successfully",
        friendship_id=friend_request.id,
        status=friend_request.status,
    )


# ==========================
# Reject Friend Request
# ==========================

@router.put(
    "/requests/{request_id}/reject",
    response_model=FriendshipActionResponse,
)
def reject_friend_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Reject a pending friend request.

    Only the receiver can reject it.
    """

    friend_request = (
        db.query(Friendship)
        .filter(Friendship.id == request_id)
        .first()
    )

    if not friend_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend request not found",
        )

    if friend_request.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the receiver can reject this friend request",
        )

    if friend_request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only a pending friend request can be rejected",
        )

    friend_request.status = "rejected"
    friend_request.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(friend_request)

    return FriendshipActionResponse(
        message="Friend request rejected successfully",
        friendship_id=friend_request.id,
        status=friend_request.status,
    )


# ==========================
# Cancel Sent Friend Request
# ==========================

@router.delete(
    "/requests/{request_id}/cancel",
    response_model=FriendshipActionResponse,
)
def cancel_friend_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel a pending friend request.

    Only the sender can cancel it.
    """

    friend_request = (
        db.query(Friendship)
        .filter(Friendship.id == request_id)
        .first()
    )

    if not friend_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend request not found",
        )

    if friend_request.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the sender can cancel this friend request",
        )

    if friend_request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only a pending friend request can be cancelled",
        )

    deleted_request_id = friend_request.id

    db.delete(friend_request)
    db.commit()

    return FriendshipActionResponse(
        message="Friend request cancelled successfully",
        friendship_id=deleted_request_id,
        status=None,
    )


# ==========================
# Friends List
# ==========================

@router.get(
    "",
    response_model=FriendsListResponse,
)
def get_friends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all accepted friends of the current user.
    """

    friendship_records = (
        db.query(Friendship)
        .options(
            joinedload(Friendship.sender),
            joinedload(Friendship.receiver),
        )
        .filter(
            Friendship.status == "accepted",
            or_(
                Friendship.sender_id == current_user.id,
                Friendship.receiver_id == current_user.id,
            ),
        )
        .order_by(Friendship.updated_at.desc())
        .all()
    )

    friends = []

    for friendship in friendship_records:
        # If current user sent the original request,
        # the receiver is the friend.
        if friendship.sender_id == current_user.id:
            friend_user = friendship.receiver

        # Otherwise, the sender is the friend.
        else:
            friend_user = friendship.sender

        friends.append(
            FriendListItemResponse(
                friendship_id=friendship.id,
                friends_since=friendship.updated_at,
                user=build_public_user(friend_user),
            )
        )

    return FriendsListResponse(
        friends=friends,
        total=len(friends),
    )


# ==========================
# Remove Friend
# ==========================

@router.delete(
    "/{user_id}",
    response_model=FriendshipActionResponse,
)
def remove_friend(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Remove an accepted friendship.
    """

    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove yourself from friends",
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

    friendship = (
        db.query(Friendship)
        .filter(
            Friendship.status == "accepted",
            or_(
                (
                    (Friendship.sender_id == current_user.id)
                    & (Friendship.receiver_id == user_id)
                ),
                (
                    (Friendship.sender_id == user_id)
                    & (Friendship.receiver_id == current_user.id)
                ),
            ),
        )
        .first()
    )

    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not friends with this user",
        )

    deleted_friendship_id = friendship.id

    db.delete(friendship)
    db.commit()

    return FriendshipActionResponse(
        message="Friend removed successfully",
        friendship_id=deleted_friendship_id,
        status=None,
    )