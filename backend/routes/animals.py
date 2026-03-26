from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
from database import get_db

router = APIRouter(prefix="/animals", tags=["animals"])


@router.get("/", response_model=List[schemas.AnimalSummary])
def list_animals(
    country: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
    species: Optional[str] = Query(None),
    owner: Optional[str] = Query(None),
    search: Optional[str] = Query(None, description="Search tag, owner, or herd"),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(models.Animal)
    if country:
        query = query.filter(models.Animal.country.ilike(f"%{country}%"))
    if village:
        query = query.filter(models.Animal.village.ilike(f"%{village}%"))
    if species:
        query = query.filter(models.Animal.species.ilike(f"%{species}%"))
    if owner:
        query = query.filter(models.Animal.owner_name.ilike(f"%{owner}%"))
    if search:
        query = query.filter(
            models.Animal.animal_tag.ilike(f"%{search}%") |
            models.Animal.owner_name.ilike(f"%{search}%") |
            models.Animal.herd_name.ilike(f"%{search}%")
        )
    return query.order_by(models.Animal.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/{animal_id}", response_model=schemas.Animal)
def get_animal(animal_id: int, db: Session = Depends(get_db)):
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    return animal


@router.post("/", response_model=schemas.AnimalSummary, status_code=201)
def create_animal(animal: schemas.AnimalCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Animal).filter(
        models.Animal.animal_tag == animal.animal_tag
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Animal tag '{animal.animal_tag}' already exists")
    db_animal = models.Animal(**animal.model_dump())
    db.add(db_animal)
    db.commit()
    db.refresh(db_animal)
    return db_animal


@router.put("/{animal_id}", response_model=schemas.AnimalSummary)
def update_animal(animal_id: int, update: schemas.AnimalUpdate, db: Session = Depends(get_db)):
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    for field, value in update.model_dump(exclude_none=True).items():
        setattr(animal, field, value)
    db.commit()
    db.refresh(animal)
    return animal


@router.delete("/{animal_id}", status_code=204)
def delete_animal(animal_id: int, db: Session = Depends(get_db)):
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    db.delete(animal)
    db.commit()
