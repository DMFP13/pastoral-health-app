import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import engine, Base, SessionLocal
import models
from routes import diseases, vets, suppliers, medicines, animals, events, triage, farmers, posts, upload
from seed_data import DISEASES, VETS, SUPPLIERS, MEDICINES, ANIMALS, EVENTS, FARMERS, POSTS

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Pastoral Livestock Health API",
    description="API for pastoral livestock disease identification, vet finder, medicine pricing and supplier locator",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diseases.router)
app.include_router(vets.router)
app.include_router(suppliers.router)
app.include_router(medicines.router)
app.include_router(animals.router)
app.include_router(events.router)
app.include_router(triage.router)
app.include_router(farmers.router)
app.include_router(posts.router)
app.include_router(upload.router)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Serve built React frontend if the dist folder exists
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str):
        # Let API routes handle themselves; serve index.html for everything else
        index = os.path.join(FRONTEND_DIST, "index.html")
        return FileResponse(index)


@app.on_event("startup")
def seed_database():
    db = SessionLocal()
    try:
        if db.query(models.Disease).count() == 0:
            for d in DISEASES:
                db.add(models.Disease(**d))
            db.commit()

        if db.query(models.Vet).count() == 0:
            for v in VETS:
                db.add(models.Vet(**v))
            db.commit()

        if db.query(models.Supplier).count() == 0:
            for s in SUPPLIERS:
                db.add(models.Supplier(**s))
            db.commit()

        if db.query(models.Medicine).count() == 0:
            suppliers_in_db = db.query(models.Supplier).all()
            supplier_id = suppliers_in_db[0].supplier_id if suppliers_in_db else None
            for m in MEDICINES:
                db.add(models.Medicine(**m, supplier_id=supplier_id))
            db.commit()

        if db.query(models.Animal).count() == 0:
            for a in ANIMALS:
                db.add(models.Animal(**a))
            db.commit()

        if db.query(models.AnimalEvent).count() == 0:
            for e in EVENTS:
                tag = e.pop("animal_tag")
                animal = db.query(models.Animal).filter(
                    models.Animal.animal_tag == tag
                ).first()
                if animal:
                    db.add(models.AnimalEvent(**e, animal_id=animal.id))
            db.commit()

        if db.query(models.Farmer).count() == 0:
            for f in FARMERS:
                db.add(models.Farmer(**f))
            db.commit()

        if db.query(models.CommunityPost).count() == 0:
            for p in POSTS:
                phone = p.pop("farmer_phone")
                farmer = None
                if phone:
                    farmer = db.query(models.Farmer).filter(models.Farmer.phone == phone).first()
                db.add(models.CommunityPost(**p, farmer_id=farmer.id if farmer else None))
            db.commit()
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "message": "Pastoral Livestock Health API",
        "docs": "/docs",
        "endpoints": ["/diseases", "/vets", "/suppliers", "/medicines", "/animals", "/events", "/triage", "/farmers", "/posts"]
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
