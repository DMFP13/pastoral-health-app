from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
from database import get_db

router = APIRouter(prefix="/vets", tags=["vets"])


@router.get("/", response_model=List[schemas.Vet])
def list_vets(
    country: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Vet)
    if country:
        query = query.filter(models.Vet.country.ilike(f"%{country}%"))
    if state:
        query = query.filter(models.Vet.state.ilike(f"%{state}%"))
    if search:
        query = query.filter(
            models.Vet.name.ilike(f"%{search}%") |
            models.Vet.location.ilike(f"%{search}%") |
            models.Vet.specialization.ilike(f"%{search}%")
        )
    return query.all()


@router.get("/{vet_id}", response_model=schemas.Vet)
def get_vet(vet_id: int, db: Session = Depends(get_db)):
    vet = db.query(models.Vet).filter(models.Vet.vet_id == vet_id).first()
    if not vet:
        raise HTTPException(status_code=404, detail="Vet not found")
    return vet


@router.post("/", response_model=schemas.Vet, status_code=201)
def create_vet(vet: schemas.VetCreate, db: Session = Depends(get_db)):
    db_vet = models.Vet(**vet.model_dump())
    db.add(db_vet)
    db.commit()
    db.refresh(db_vet)
    return db_vet
