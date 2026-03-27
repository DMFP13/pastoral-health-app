from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from database import get_db
import models
import schemas
from datetime import datetime, timezone

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/conversations")
def list_conversations(farmer_id: int, db: Session = Depends(get_db)):
    """Return a list of conversations (unique partners) for a farmer, most recent first."""
    farmer = db.query(models.Farmer).filter(models.Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(404, "Farmer not found")

    # Get all messages involving this farmer
    msgs = (
        db.query(models.Message)
        .filter(
            or_(
                models.Message.sender_id == farmer_id,
                models.Message.receiver_id == farmer_id,
            )
        )
        .order_by(models.Message.created_at.desc())
        .all()
    )

    # Build conversation summaries keyed by the other farmer's id
    seen: dict[int, schemas.ConversationSummary] = {}
    for msg in msgs:
        other_id = msg.receiver_id if msg.sender_id == farmer_id else msg.sender_id
        if other_id in seen:
            continue
        other = db.query(models.Farmer).filter(models.Farmer.id == other_id).first()
        if not other:
            continue
        unread = (
            db.query(func.count(models.Message.id))
            .filter(
                models.Message.sender_id == other_id,
                models.Message.receiver_id == farmer_id,
                models.Message.read_at.is_(None),
            )
            .scalar()
            or 0
        )
        seen[other_id] = schemas.ConversationSummary(
            other_farmer=schemas.Farmer.model_validate(other),
            last_message=msg.body,
            last_message_at=msg.created_at,
            unread_count=unread,
        )

    return list(seen.values())


@router.get("/thread")
def get_thread(farmer_id: int, other_id: int, db: Session = Depends(get_db)):
    """Return all messages between two farmers, oldest first."""
    msgs = (
        db.query(models.Message)
        .filter(
            or_(
                and_(
                    models.Message.sender_id == farmer_id,
                    models.Message.receiver_id == other_id,
                ),
                and_(
                    models.Message.sender_id == other_id,
                    models.Message.receiver_id == farmer_id,
                ),
            )
        )
        .order_by(models.Message.created_at)
        .all()
    )
    return [schemas.MessageOut.model_validate(m) for m in msgs]


@router.post("/", status_code=201)
def send_message(payload: schemas.MessageCreate, db: Session = Depends(get_db)):
    """Send a message from one farmer to another."""
    for fid in (payload.sender_id, payload.receiver_id):
        if not db.query(models.Farmer).filter(models.Farmer.id == fid).first():
            raise HTTPException(404, f"Farmer {fid} not found")
    msg = models.Message(
        sender_id=payload.sender_id,
        receiver_id=payload.receiver_id,
        body=payload.body,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return schemas.MessageOut.model_validate(msg)


@router.put("/read")
def mark_read(farmer_id: int, other_id: int, db: Session = Depends(get_db)):
    """Mark all messages from other_id to farmer_id as read."""
    now = datetime.now(timezone.utc)
    db.query(models.Message).filter(
        models.Message.sender_id == other_id,
        models.Message.receiver_id == farmer_id,
        models.Message.read_at.is_(None),
    ).update({"read_at": now})
    db.commit()
    return {"ok": True}
