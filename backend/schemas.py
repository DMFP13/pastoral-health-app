from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DiseaseBase(BaseModel):
    name: str = Field(max_length=200)
    symptoms: str = Field(max_length=2000)
    treatment_guidance: str = Field(max_length=2000)
    affected_species: str = Field(max_length=200)
    severity: Optional[str] = "moderate"
    is_contagious: Optional[str] = "yes"
    prevention: Optional[str] = Field(default=None, max_length=2000)


class DiseaseCreate(DiseaseBase):
    pass


class Disease(DiseaseBase):
    disease_id: int

    class Config:
        from_attributes = True


class VetBase(BaseModel):
    name: str
    phone: str
    location: str
    state: Optional[str] = None
    country: str
    specialization: Optional[str] = None
    available: Optional[str] = "yes"


class VetCreate(VetBase):
    pass


class Vet(VetBase):
    vet_id: int

    class Config:
        from_attributes = True


class SupplierBase(BaseModel):
    name: str
    contact_info: str
    location: str
    website: Optional[str] = None
    country: str


class SupplierCreate(SupplierBase):
    pass


class Supplier(SupplierBase):
    supplier_id: int

    class Config:
        from_attributes = True


class MedicineBase(BaseModel):
    name: str
    supplier_id: Optional[int] = None
    type: str
    price_range: Optional[str] = None
    indication: str
    dosage: Optional[str] = None


class MedicineCreate(MedicineBase):
    pass


class Medicine(MedicineBase):
    medicine_id: int
    supplier: Optional[Supplier] = None

    class Config:
        from_attributes = True


# ── Animal ──────────────────────────────────────────────
class AnimalBase(BaseModel):
    animal_tag: str = Field(max_length=50)
    species: str = Field(max_length=50)
    breed: Optional[str] = Field(default=None, max_length=100)
    sex: Optional[str] = Field(default=None, max_length=20)
    approximate_age: Optional[str] = Field(default=None, max_length=50)
    owner_name: str = Field(max_length=200)
    herd_name: Optional[str] = Field(default=None, max_length=200)
    village: Optional[str] = Field(default=None, max_length=200)
    country: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=2000)
    photo_url: Optional[str] = Field(default=None, max_length=500)
    qr_code: Optional[str] = Field(default=None, max_length=500)


class AnimalCreate(AnimalBase):
    pass


class AnimalUpdate(BaseModel):
    species: Optional[str] = None
    breed: Optional[str] = None
    sex: Optional[str] = None
    approximate_age: Optional[str] = None
    owner_name: Optional[str] = None
    herd_name: Optional[str] = None
    village: Optional[str] = None
    country: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None


class AnimalSummary(AnimalBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Animal(AnimalBase):
    id: int
    created_at: Optional[datetime] = None
    events: List["AnimalEvent"] = []

    class Config:
        from_attributes = True


# ── Animal Event ─────────────────────────────────────────
class AnimalEventBase(BaseModel):
    animal_id: int
    event_type: str
    event_date: str
    symptoms: Optional[str] = None
    temperature: Optional[float] = None
    eating_status: Optional[str] = None
    mobility_status: Optional[str] = None
    risk_level: Optional[str] = None
    recommendation: Optional[str] = None
    action_taken: Optional[str] = None
    follow_up_date: Optional[str] = None
    outcome: Optional[str] = None
    location: Optional[str] = None
    image_url: Optional[str] = None


class AnimalEventCreate(AnimalEventBase):
    pass


class AnimalEvent(AnimalEventBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Update forward ref for Animal.events
Animal.model_rebuild()


# ── Triage ───────────────────────────────────────────────
class TriageInput(BaseModel):
    species: str
    symptoms: List[str] = []
    eating: Optional[bool] = None        # True=normal, False=not eating, None=unknown
    lameness: bool = False
    fever: bool = False
    nasal_discharge: bool = False
    salivation: bool = False
    lesions: bool = False                # skin or mouth lesions
    coughing: bool = False
    pregnancy_status: Optional[str] = None   # pregnant / not_pregnant / unknown
    recent_calving: Optional[bool] = None
    country: Optional[str] = None       # used to suggest nearby vets


class ConditionMatch(BaseModel):
    condition: str
    confidence: str      # "possible" or "likely"
    economic_note: str


class TriageOutput(BaseModel):
    likely_conditions: List[ConditionMatch]
    risk_level: str      # low / moderate / high / emergency
    recommendation: str
    urgency_hours: Optional[int] = None
    isolate_animal: bool
    call_vet: bool
    rationale: List[str]
    economic_note: str
    suggested_vets: List[Vet] = []


# ── Farmer ───────────────────────────────────────────────
class FarmerBase(BaseModel):
    phone: str = Field(max_length=30)
    name: str = Field(max_length=200)
    village: Optional[str] = Field(default=None, max_length=200)
    lga: Optional[str] = Field(default=None, max_length=200)
    state: Optional[str] = Field(default=None, max_length=100)
    country: Optional[str] = Field(default=None, max_length=100)
    preferred_language: Optional[str] = Field(default="en", max_length=10)
    herd_name: Optional[str] = Field(default=None, max_length=200)
    herd_size: Optional[int] = Field(default=None, ge=0, le=100000)
    photo_url: Optional[str] = Field(default=None, max_length=500)
    insurance_provider: Optional[str] = Field(default=None, max_length=200)
    emergency_contact: Optional[str] = Field(default=None, max_length=30)


class FarmerCreate(FarmerBase):
    pass


class FarmerUpdate(BaseModel):
    name: Optional[str] = None
    village: Optional[str] = None
    lga: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    preferred_language: Optional[str] = None
    herd_name: Optional[str] = None
    herd_size: Optional[int] = None
    photo_url: Optional[str] = None
    insurance_provider: Optional[str] = None
    emergency_contact: Optional[str] = None


class Farmer(FarmerBase):
    id: int
    verified: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Community Post ────────────────────────────────────────
class PostCommentBase(BaseModel):
    post_id: int
    farmer_id: Optional[int] = None
    body: str = Field(max_length=1000)


class PostCommentCreate(PostCommentBase):
    pass


class PostComment(PostCommentBase):
    id: int
    created_at: Optional[datetime] = None
    farmer: Optional[Farmer] = None

    class Config:
        from_attributes = True


class CommunityPostBase(BaseModel):
    farmer_id: Optional[int] = None
    category: str = Field(max_length=50)
    body: str = Field(max_length=2000)
    village: Optional[str] = Field(default=None, max_length=200)
    lga: Optional[str] = Field(default=None, max_length=200)
    state: Optional[str] = Field(default=None, max_length=100)
    country: Optional[str] = Field(default=None, max_length=100)
    image_url: Optional[str] = Field(default=None, max_length=500)


class CommunityPostCreate(CommunityPostBase):
    pass


class CommunityPost(CommunityPostBase):
    id: int
    created_at: Optional[datetime] = None
    farmer: Optional[Farmer] = None
    comments: List[PostComment] = []

    class Config:
        from_attributes = True


class CommunityPostSummary(CommunityPostBase):
    id: int
    created_at: Optional[datetime] = None
    farmer: Optional[Farmer] = None
    comment_count: int = 0

    class Config:
        from_attributes = True
