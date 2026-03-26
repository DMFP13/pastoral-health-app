from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from typing import List, Optional

router = APIRouter(prefix="/farmers", tags=["farmers"])

VALID_LANGUAGES = {"en", "ha", "ff", "yo", "ig"}


@router.get("/", response_model=List[schemas.Farmer])
def list_farmers(
    country: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Farmer)
    if country:
        q = q.filter(models.Farmer.country.ilike(f"%{country}%"))
    if state:
        q = q.filter(models.Farmer.state.ilike(f"%{state}%"))
    return q.order_by(models.Farmer.name).all()


@router.get("/{farmer_id}", response_model=schemas.Farmer)
def get_farmer(farmer_id: int, db: Session = Depends(get_db)):
    farmer = db.query(models.Farmer).filter(models.Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return farmer


@router.post("/", response_model=schemas.Farmer, status_code=201)
def create_farmer(data: schemas.FarmerCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Farmer).filter(models.Farmer.phone == data.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    if data.preferred_language and data.preferred_language not in VALID_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Language must be one of: {', '.join(VALID_LANGUAGES)}")
    farmer = models.Farmer(**data.model_dump())
    db.add(farmer)
    db.commit()
    db.refresh(farmer)
    return farmer


@router.put("/{farmer_id}", response_model=schemas.Farmer)
def update_farmer(farmer_id: int, data: schemas.FarmerUpdate, db: Session = Depends(get_db)):
    farmer = db.query(models.Farmer).filter(models.Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    if data.preferred_language and data.preferred_language not in VALID_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Language must be one of: {', '.join(VALID_LANGUAGES)}")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(farmer, field, value)
    db.commit()
    db.refresh(farmer)
    return farmer


@router.delete("/{farmer_id}", status_code=204)
def delete_farmer(farmer_id: int, db: Session = Depends(get_db)):
    farmer = db.query(models.Farmer).filter(models.Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    db.delete(farmer)
    db.commit()


@router.get("/{farmer_id}/animals", response_model=List[schemas.AnimalSummary])
def farmer_animals(farmer_id: int, db: Session = Depends(get_db)):
    farmer = db.query(models.Farmer).filter(models.Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return db.query(models.Animal).filter(
        models.Animal.owner_name == farmer.name
    ).all()
