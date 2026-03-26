from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
from database import get_db

router = APIRouter(prefix="/medicines", tags=["medicines"])


@router.get("/", response_model=List[schemas.Medicine])
def list_medicines(
    type: Optional[str] = Query(None, description="Filter by type (antibiotic, vaccine, etc.)"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Medicine)
    if type:
        query = query.filter(models.Medicine.type.ilike(f"%{type}%"))
    if search:
        query = query.filter(
            models.Medicine.name.ilike(f"%{search}%") |
            models.Medicine.indication.ilike(f"%{search}%")
        )
    return query.all()


@router.get("/{medicine_id}", response_model=schemas.Medicine)
def get_medicine(medicine_id: int, db: Session = Depends(get_db)):
    medicine = db.query(models.Medicine).filter(models.Medicine.medicine_id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return medicine


@router.post("/", response_model=schemas.Medicine, status_code=201)
def create_medicine(medicine: schemas.MedicineCreate, db: Session = Depends(get_db)):
    db_medicine = models.Medicine(**medicine.model_dump())
    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)
    return db_medicine
