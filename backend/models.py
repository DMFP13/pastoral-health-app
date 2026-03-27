from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Disease(Base):
    __tablename__ = "diseases"

    disease_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    symptoms = Column(Text, nullable=False)
    treatment_guidance = Column(Text, nullable=False)
    affected_species = Column(String(500), nullable=False)
    severity = Column(String(50), default="moderate")
    is_contagious = Column(String(10), default="yes")
    prevention = Column(Text, nullable=True)


class Vet(Base):
    __tablename__ = "vets"

    vet_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    phone = Column(String(50), nullable=False)
    location = Column(String(300), nullable=False)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=False)
    specialization = Column(String(200), nullable=True)
    available = Column(String(10), default="yes")


class Supplier(Base):
    __tablename__ = "suppliers"

    supplier_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    contact_info = Column(String(500), nullable=False)
    location = Column(String(300), nullable=False)
    website = Column(String(300), nullable=True)
    country = Column(String(100), nullable=False)
    medicines = relationship("Medicine", back_populates="supplier")


class Medicine(Base):
    __tablename__ = "medicines"

    medicine_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"), nullable=True)
    type = Column(String(100), nullable=False)
    price_range = Column(String(100), nullable=True)
    indication = Column(Text, nullable=False)
    dosage = Column(String(200), nullable=True)
    supplier = relationship("Supplier", back_populates="medicines")


class Animal(Base):
    __tablename__ = "animals"

    id = Column(Integer, primary_key=True, index=True)
    animal_tag = Column(String(100), unique=True, nullable=False, index=True)
    species = Column(String(100), nullable=False)
    breed = Column(String(200), nullable=True)
    sex = Column(String(20), nullable=True)
    approximate_age = Column(String(50), nullable=True)
    owner_name = Column(String(200), nullable=False)
    herd_name = Column(String(200), nullable=True)
    village = Column(String(200), nullable=True)
    country = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    qr_code = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    events = relationship("AnimalEvent", back_populates="animal", cascade="all, delete-orphan")


class AnimalEvent(Base):
    __tablename__ = "animal_events"

    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("animals.id"), nullable=False)
    event_type = Column(String(50), nullable=False)  # illness/treatment/birth/death/sale/vaccination/heat/injury/other
    event_date = Column(String(20), nullable=False)  # stored as ISO date string for SQLite simplicity
    symptoms = Column(Text, nullable=True)
    temperature = Column(Float, nullable=True)
    eating_status = Column(String(50), nullable=True)   # normal / reduced / not_eating
    mobility_status = Column(String(50), nullable=True) # normal / reduced / immobile
    risk_level = Column(String(20), nullable=True)      # low / moderate / high / emergency
    recommendation = Column(Text, nullable=True)
    action_taken = Column(Text, nullable=True)
    follow_up_date = Column(String(20), nullable=True)
    outcome = Column(Text, nullable=True)
    location = Column(String(300), nullable=True)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    animal = relationship("Animal", back_populates="events")


class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    village = Column(String(200), nullable=True)
    lga = Column(String(200), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    preferred_language = Column(String(20), default="en")  # en, ha, ff, yo, ig
    herd_name = Column(String(200), nullable=True)
    herd_size = Column(Integer, nullable=True)
    photo_url = Column(String(500), nullable=True)
    verified = Column(Boolean, default=False)
    insurance_provider = Column(String(200), nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    posts = relationship("CommunityPost", back_populates="farmer", cascade="all, delete-orphan")
    comments = relationship("PostComment", back_populates="farmer", cascade="all, delete-orphan")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender", cascade="all, delete-orphan")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver", cascade="all, delete-orphan")


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=True)
    category = Column(String(50), nullable=False)  # disease_alert, missing_animal, theft, water, pasture, weather, advice, market
    body = Column(Text, nullable=False)
    village = Column(String(200), nullable=True)
    lga = Column(String(200), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farmer = relationship("Farmer", back_populates="posts")
    comments = relationship("PostComment", back_populates="post", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id          = Column(Integer, primary_key=True, index=True)
    sender_id   = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    body        = Column(Text, nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    read_at     = Column(DateTime(timezone=True), nullable=True)

    sender   = relationship("Farmer", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("Farmer", foreign_keys=[receiver_id], back_populates="received_messages")


class PostComment(Base):
    __tablename__ = "post_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("CommunityPost", back_populates="comments")
    farmer = relationship("Farmer", back_populates="comments")
