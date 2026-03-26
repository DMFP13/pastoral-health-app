from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
from database import get_db

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("/", response_model=List[schemas.Supplier])
def list_suppliers(
    country: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Supplier)
    if country:
        query = query.filter(models.Supplier.country.ilike(f"%{country}%"))
    if state:
        query = query.filter(models.Supplier.location.ilike(f"%{state}%"))
    if search:
        query = query.filter(
            models.Supplier.name.ilike(f"%{search}%") |
            models.Supplier.location.ilike(f"%{search}%")
        )
    return query.all()


@router.get("/{supplier_id}", response_model=schemas.Supplier)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(models.Supplier).filter(models.Supplier.supplier_id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.post("/", response_model=schemas.Supplier, status_code=201)
def create_supplier(supplier: schemas.SupplierCreate, db: Session = Depends(get_db)):
    db_supplier = models.Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier
