from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Optional, Set

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
)
from jose import JWTError, jwt
from pydantic import ValidationError
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session, aliased, selectinload

from auth import (
    ALGORITHM,
    SECRET_KEY,
    get_current_user,
)
from database import SessionLocal, get_db
from models import (
    Conversation,
    ConversationParticipant,
    Friendship,
    Message,
    User,
)
from schemas import (
    ConversationActionResponse,
    ConversationListResponse,
    ConversationResponse,
    ConversationUserResponse,
    LastMessageResponse,
    MarkMessagesReadResponse,
    MessageCreate,
    MessageResponse,
    MessagesListResponse,
    WebSocketMessageCreate,
)


router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


# ==========================
# WebSocket Connection Manager
# ==========================

class ConnectionManager:
    """
    Stores active WebSocket connections by user ID.

    A set is used because the same user may open the app
    in more than one browser tab.
    """

    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = defaultdict(set)

    async def connect(
        self,
        user_id: int,
        websocket: WebSocket,
    ):
        await websocket.accept()
        self.active_connections[user_id].add(websocket)

    def disconnect(
        self,
        user_id: int,
        websocket: WebSocket,
    ):
        connections = self.active_connections.get(user_id)

        if not connections:
            return

        connections.discard(websocket)

        if not connections:
            self.active_connections.pop(user_id, None)

    def is_user_online(self, user_id: int) -> bool:
        return bool(self.active_connections.get(user_id))

    async def send_to_user(
        self,
        user_id: int,
        data: dict,
    ) -> bool:
        """
        Send an event to every active connection of a user.

        Returns True when at least one connection received it.
        """

        connections = list(
            self.active_connections.get(user_id, set())
        )

        if not connections:
            return False

        delivered = False
        disconnected_connections: List[WebSocket] = []

        for connection in connections:
            try:
                await connection.send_json(data)
                delivered = True
            except Exception:
                disconnected_connections.append(connection)

        for connection in disconnected_connections:
            self.disconnect(user_id, connection)

        return delivered


manager = ConnectionManager()


# ==========================
# Helper Functions
# ==========================

def get_conversation_participant(
    db: Session,
    conversation_id: int,
    user_id: int,
) -> Optional[ConversationParticipant]:
    return (
        db.query(ConversationParticipant)
        .filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
        .first()
    )


def require_conversation_access(
    db: Session,
    conversation_id: int,
    user_id: int,
) -> ConversationParticipant:
    participant = get_conversation_participant(
        db=db,
        conversation_id=conversation_id,
        user_id=user_id,
    )

    if not participant:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to access this conversation.",
        )

    return participant


def get_other_participant(
    db: Session,
    conversation_id: int,
    current_user_id: int,
) -> ConversationParticipant:
    participant = (
        db.query(ConversationParticipant)
        .options(
            selectinload(ConversationParticipant.user)
        )
        .filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id != current_user_id,
        )
        .first()
    )

    if not participant:
        raise HTTPException(
            status_code=404,
            detail="Other conversation participant was not found.",
        )

    return participant


def are_users_friends(
    db: Session,
    first_user_id: int,
    second_user_id: int,
) -> bool:
    friendship = (
        db.query(Friendship)
        .filter(
            Friendship.status == "accepted",
            or_(
                and_(
                    Friendship.sender_id == first_user_id,
                    Friendship.receiver_id == second_user_id,
                ),
                and_(
                    Friendship.sender_id == second_user_id,
                    Friendship.receiver_id == first_user_id,
                ),
            ),
        )
        .first()
    )

    return friendship is not None


def find_direct_conversation(
    db: Session,
    first_user_id: int,
    second_user_id: int,
) -> Optional[Conversation]:
    first_participant = aliased(ConversationParticipant)
    second_participant = aliased(ConversationParticipant)

    return (
        db.query(Conversation)
        .join(
            first_participant,
            first_participant.conversation_id == Conversation.id,
        )
        .join(
            second_participant,
            second_participant.conversation_id == Conversation.id,
        )
        .filter(
            first_participant.user_id == first_user_id,
            second_participant.user_id == second_user_id,
        )
        .first()
    )


def build_message_response(message: Message) -> MessageResponse:
    return MessageResponse.model_validate(message)


def build_conversation_response(
    db: Session,
    conversation: Conversation,
    current_user_id: int,
) -> ConversationResponse:
    other_participant = get_other_participant(
        db=db,
        conversation_id=conversation.id,
        current_user_id=current_user_id,
    )

    last_message = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(
            Message.created_at.desc(),
            Message.id.desc(),
        )
        .first()
    )

    unread_count = (
        db.query(func.count(Message.id))
        .filter(
            Message.conversation_id == conversation.id,
            Message.sender_id != current_user_id,
            Message.is_read.is_(False),
        )
        .scalar()
        or 0
    )

    last_message_response = None

    if last_message:
        last_message_response = LastMessageResponse(
            id=last_message.id,
            sender_id=last_message.sender_id,
            content=last_message.content,
            is_delivered=last_message.is_delivered,
            is_read=last_message.is_read,
            created_at=last_message.created_at,
        )

    return ConversationResponse(
        id=conversation.id,
        other_user=ConversationUserResponse.model_validate(
            other_participant.user
        ),
        last_message=last_message_response,
        unread_count=unread_count,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )


def save_message(
    db: Session,
    conversation: Conversation,
    sender_id: int,
    content: str,
) -> Message:
    cleaned_content = content.strip()

    if not cleaned_content:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    message = Message(
        conversation_id=conversation.id,
        sender_id=sender_id,
        content=cleaned_content,
        is_delivered=False,
        is_read=False,
    )

    conversation.updated_at = datetime.utcnow()

    db.add(message)
    db.commit()
    db.refresh(message)

    return (
        db.query(Message)
        .options(selectinload(Message.sender))
        .filter(Message.id == message.id)
        .first()
    )


def authenticate_websocket_user(
    token: Optional[str],
    db: Session,
) -> Optional[User]:
    if not token:
        return None

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
    except JWTError:
        return None

    email = payload.get("sub")

    if not email:
        return None

    return (
        db.query(User)
        .filter(User.email == email)
        .first()
    )


# ==========================
# Conversation REST APIs
# ==========================

@router.post(
    "/conversations/{user_id}",
    response_model=ConversationActionResponse,
)
def create_or_get_conversation(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot start a conversation with yourself.",
        )

    other_user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not other_user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if not are_users_friends(
        db=db,
        first_user_id=current_user.id,
        second_user_id=user_id,
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only start a chat with an accepted friend.",
        )

    existing_conversation = find_direct_conversation(
        db=db,
        first_user_id=current_user.id,
        second_user_id=user_id,
    )

    if existing_conversation:
        return ConversationActionResponse(
            message="Conversation already exists.",
            conversation=build_conversation_response(
                db=db,
                conversation=existing_conversation,
                current_user_id=current_user.id,
            ),
        )

    conversation = Conversation()

    db.add(conversation)
    db.flush()

    db.add_all([
        ConversationParticipant(
            conversation_id=conversation.id,
            user_id=current_user.id,
        ),
        ConversationParticipant(
            conversation_id=conversation.id,
            user_id=user_id,
        ),
    ])

    db.commit()
    db.refresh(conversation)

    return ConversationActionResponse(
        message="Conversation created successfully.",
        conversation=build_conversation_response(
            db=db,
            conversation=conversation,
            current_user_id=current_user.id,
        ),
    )


@router.get(
    "/conversations",
    response_model=ConversationListResponse,
)
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    participant_rows = (
        db.query(ConversationParticipant)
        .filter(
            ConversationParticipant.user_id == current_user.id
        )
        .all()
    )

    conversation_ids = [
        row.conversation_id
        for row in participant_rows
    ]

    if not conversation_ids:
        return ConversationListResponse(
            conversations=[],
            total=0,
        )

    conversations = (
        db.query(Conversation)
        .filter(Conversation.id.in_(conversation_ids))
        .order_by(
            Conversation.updated_at.desc(),
            Conversation.id.desc(),
        )
        .all()
    )

    items = [
        build_conversation_response(
            db=db,
            conversation=conversation,
            current_user_id=current_user.id,
        )
        for conversation in conversations
    ]

    return ConversationListResponse(
        conversations=items,
        total=len(items),
    )


# ==========================
# Message REST APIs
# ==========================

@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=MessagesListResponse,
)
def get_messages(
    conversation_id: int,
    limit: int = Query(
        default=30,
        ge=1,
        le=100,
    ),
    before_id: Optional[int] = Query(
        default=None,
        ge=1,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_conversation_access(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
    )

    query = (
        db.query(Message)
        .options(selectinload(Message.sender))
        .filter(Message.conversation_id == conversation_id)
    )

    if before_id is not None:
        query = query.filter(Message.id < before_id)

    newest_first = (
        query.order_by(Message.id.desc())
        .limit(limit + 1)
        .all()
    )

    has_more = len(newest_first) > limit
    selected_messages = newest_first[:limit]
    selected_messages.reverse()

    next_before_id = None

    if has_more and selected_messages:
        next_before_id = selected_messages[0].id

    return MessagesListResponse(
        messages=[
            build_message_response(message)
            for message in selected_messages
        ],
        conversation_id=conversation_id,
        limit=limit,
        has_more=has_more,
        next_before_id=next_before_id,
    )


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
)
async def send_message_rest(
    conversation_id: int,
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_conversation_access(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
    )

    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    other_participant = get_other_participant(
        db=db,
        conversation_id=conversation_id,
        current_user_id=current_user.id,
    )

    message = save_message(
        db=db,
        conversation=conversation,
        sender_id=current_user.id,
        content=message_data.content,
    )

    message_response = build_message_response(message)

    delivered = await manager.send_to_user(
        other_participant.user_id,
        {
            "type": "new_message",
            "message": message_response.model_dump(mode="json"),
        },
    )

    if delivered:
        message.is_delivered = True
        message.delivered_at = datetime.utcnow()
        db.commit()
        db.refresh(message)
        message_response = build_message_response(message)

    return message_response


@router.patch(
    "/conversations/{conversation_id}/read",
    response_model=MarkMessagesReadResponse,
)
async def mark_messages_as_read(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_conversation_access(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
    )

    unread_messages = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id,
            Message.sender_id != current_user.id,
            Message.is_read.is_(False),
        )
        .all()
    )

    if not unread_messages:
        return MarkMessagesReadResponse(
            message="No unread messages found.",
            conversation_id=conversation_id,
            marked_read_count=0,
        )

    read_time = datetime.utcnow()
    sender_ids = set()

    for message in unread_messages:
        message.is_read = True
        message.read_at = read_time
        sender_ids.add(message.sender_id)

    db.commit()

    read_message_ids = [
        message.id
        for message in unread_messages
    ]

    for sender_id in sender_ids:
        await manager.send_to_user(
            sender_id,
            {
                "type": "messages_read",
                "conversation_id": conversation_id,
                "message_ids": read_message_ids,
                "read_at": read_time.isoformat(),
            },
        )

    return MarkMessagesReadResponse(
        message="Messages marked as read.",
        conversation_id=conversation_id,
        marked_read_count=len(unread_messages),
    )


# ==========================
# WebSocket Chat Endpoint
# ==========================

@router.websocket("/ws/{conversation_id}")
async def chat_websocket(
    websocket: WebSocket,
    conversation_id: int,
):
    token = websocket.query_params.get("token")
    db = SessionLocal()
    current_user: Optional[User] = None

    try:
        current_user = authenticate_websocket_user(
            token=token,
            db=db,
        )

        if not current_user:
            await websocket.close(
                code=1008,
                reason="Invalid or missing authentication token.",
            )
            return

        participant = get_conversation_participant(
            db=db,
            conversation_id=conversation_id,
            user_id=current_user.id,
        )

        if not participant:
            await websocket.close(
                code=1008,
                reason="You cannot access this conversation.",
            )
            return

        conversation = (
            db.query(Conversation)
            .filter(Conversation.id == conversation_id)
            .first()
        )

        if not conversation:
            await websocket.close(
                code=1008,
                reason="Conversation not found.",
            )
            return

        other_participant = get_other_participant(
            db=db,
            conversation_id=conversation_id,
            current_user_id=current_user.id,
        )

        await manager.connect(
            user_id=current_user.id,
            websocket=websocket,
        )

        await websocket.send_json({
            "type": "connected",
            "conversation_id": conversation_id,
            "detail": "WebSocket connected successfully.",
        })

        while True:
            raw_data = await websocket.receive_json()

            try:
                socket_message = WebSocketMessageCreate.model_validate(
                    raw_data
                )
            except ValidationError as validation_error:
                await websocket.send_json({
                    "type": "error",
                    "detail": validation_error.errors()[0]["msg"],
                })
                continue

            message = save_message(
                db=db,
                conversation=conversation,
                sender_id=current_user.id,
                content=socket_message.content,
            )

            message_response = build_message_response(message)

            # Confirm the saved message to the sender.
            await manager.send_to_user(
                current_user.id,
                {
                    "type": "message_sent",
                    "message": message_response.model_dump(mode="json"),
                },
            )

            delivered = await manager.send_to_user(
                other_participant.user_id,
                {
                    "type": "new_message",
                    "message": message_response.model_dump(mode="json"),
                },
            )

            if delivered:
                message.is_delivered = True
                message.delivered_at = datetime.utcnow()
                db.commit()
                db.refresh(message)

                delivered_response = build_message_response(message)

                await manager.send_to_user(
                    current_user.id,
                    {
                        "type": "message_delivered",
                        "message": delivered_response.model_dump(
                            mode="json"
                        ),
                    },
                )

    except WebSocketDisconnect:
        pass

    except Exception as error:
        db.rollback()

        try:
            await websocket.send_json({
                "type": "error",
                "detail": str(error),
            })
        except Exception:
            pass

    finally:
        if current_user:
            manager.disconnect(
                user_id=current_user.id,
                websocket=websocket,
            )

        db.close()