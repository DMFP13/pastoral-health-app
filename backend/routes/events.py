from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
from database import get_db

router = APIRouter(prefix="/events", tags=["events"])

EVENT_TYPES = [
    "illness", "treatment", "birth", "death",
    "sale", "vaccination", "heat", "injury", "other"
]


@router.get("/", response_model=List[schemas.AnimalEvent])
def list_events(
    animal_id: Optional[int] = Query(None),
    event_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.AnimalEvent)
    if animal_id:
        query = query.filter(models.AnimalEvent.animal_id == animal_id)
    if event_type:
        query = query.filter(models.AnimalEvent.event_type == event_type)
    return query.order_by(models.AnimalEvent.event_date.desc()).all()


@router.get("/types", response_model=List[str])
def get_event_types():
    return EVENT_TYPES


@router.get("/{event_id}", response_model=schemas.AnimalEvent)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.AnimalEvent).filter(models.AnimalEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("/bulk", status_code=201)
def create_events_bulk(events: List[schemas.AnimalEventCreate], db: Session = Depends(get_db)):
    """Create multiple events at once (used for bulk vaccination)."""
    created = []
    errors = []
    for ev in events:
        animal = db.query(models.Animal).filter(models.Animal.id == ev.animal_id).first()
        if not animal:
            errors.append({"animal_id": ev.animal_id, "error": "Animal not found"})
            continue
        db_ev = models.AnimalEvent(**ev.model_dump())
        db.add(db_ev)
        created.append(ev.animal_id)
    db.commit()
    return {"created": len(created), "errors": errors}


@router.post("/", response_model=schemas.AnimalEvent, status_code=201)
def create_event(event: schemas.AnimalEventCreate, db: Session = Depends(get_db)):
    # Verify animal exists
    animal = db.query(models.Animal).filter(models.Animal.id == event.animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail=f"Animal {event.animal_id} not found")
    db_event = models.AnimalEvent(**event.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.AnimalEvent).filter(models.AnimalEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
