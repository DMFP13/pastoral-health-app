from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
from database import get_db

router = APIRouter(prefix="/diseases", tags=["diseases"])


@router.get("/", response_model=List[schemas.Disease])
def list_diseases(
    search: Optional[str] = Query(None, description="Search by name or symptoms"),
    species: Optional[str] = Query(None, description="Filter by affected species"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Disease)
    if search:
        query = query.filter(
            models.Disease.name.ilike(f"%{search}%") |
            models.Disease.symptoms.ilike(f"%{search}%")
        )
    if species:
        query = query.filter(models.Disease.affected_species.ilike(f"%{species}%"))
    return query.all()


@router.get("/{disease_id}", response_model=schemas.Disease)
def get_disease(disease_id: int, db: Session = Depends(get_db)):
    disease = db.query(models.Disease).filter(models.Disease.disease_id == disease_id).first()
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")
    return disease


@router.post("/", response_model=schemas.Disease, status_code=201)
def create_disease(disease: schemas.DiseaseCreate, db: Session = Depends(get_db)):
    db_disease = models.Disease(**disease.model_dump())
    db.add(db_disease)
    db.commit()
    db.refresh(db_disease)
    return db_disease
