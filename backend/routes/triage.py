from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import models
import schemas
from database import get_db
from triage_engine import run_triage

router = APIRouter(prefix="/triage", tags=["triage"])


@router.post("/", response_model=schemas.TriageOutput)
def triage(data: schemas.TriageInput, db: Session = Depends(get_db)):
    # Fetch available vets in the same country for high-risk suggestions
    suggested_vets = []
    if data.country:
        vets = (
            db.query(models.Vet)
            .filter(
                models.Vet.country.ilike(f"%{data.country}%"),
                models.Vet.available == "yes"
            )
            .limit(3)
            .all()
        )
        suggested_vets = [
            schemas.Vet.model_validate(v) for v in vets
        ]

    result = run_triage(data, suggested_vets=suggested_vets)
    return result
