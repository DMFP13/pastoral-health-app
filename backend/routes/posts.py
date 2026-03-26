from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
import schemas
from typing import List, Optional

router = APIRouter(prefix="/posts", tags=["community"])

VALID_CATEGORIES = {
    "disease_alert", "missing_animal", "theft", "water",
    "pasture", "weather", "advice", "market",
}


@router.get("/categories")
def list_categories():
    return list(VALID_CATEGORIES)


@router.get("/feed", response_model=List[schemas.CommunityPostSummary])
def get_feed(
    category: Optional[str] = None,
    country: Optional[str] = None,
    state: Optional[str] = None,
    village: Optional[str] = None,
    limit: int = Query(default=30, le=100),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    # Single query: join comment counts via subquery to avoid N+1
    comment_counts = (
        db.query(models.PostComment.post_id, func.count().label("cnt"))
        .group_by(models.PostComment.post_id)
        .subquery()
    )
    q = db.query(models.CommunityPost, comment_counts.c.cnt).outerjoin(
        comment_counts, models.CommunityPost.id == comment_counts.c.post_id
    )
    if category:
        q = q.filter(models.CommunityPost.category == category)
    if country:
        q = q.filter(models.CommunityPost.country.ilike(f"%{country}%"))
    if state:
        q = q.filter(models.CommunityPost.state.ilike(f"%{state}%"))
    if village:
        q = q.filter(models.CommunityPost.village.ilike(f"%{village}%"))
    rows = q.order_by(models.CommunityPost.created_at.desc()).offset(offset).limit(limit).all()

    result = []
    for post, cnt in rows:
        summary = schemas.CommunityPostSummary.model_validate(post)
        summary.comment_count = cnt or 0
        result.append(summary)
    return result


@router.get("/{post_id}", response_model=schemas.CommunityPost)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/", response_model=schemas.CommunityPost, status_code=201)
def create_post(data: schemas.CommunityPostCreate, db: Session = Depends(get_db)):
    if data.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Category must be one of: {', '.join(sorted(VALID_CATEGORIES))}")
    if data.farmer_id:
        farmer = db.query(models.Farmer).filter(models.Farmer.id == data.farmer_id).first()
        if not farmer:
            raise HTTPException(status_code=400, detail="Farmer not found")
    post = models.CommunityPost(**data.model_dump())
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.delete("/{post_id}", status_code=204)
def delete_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()


@router.post("/{post_id}/comments", response_model=schemas.PostComment, status_code=201)
def add_comment(post_id: int, data: schemas.PostCommentCreate, db: Session = Depends(get_db)):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    comment = models.PostComment(post_id=post_id, farmer_id=data.farmer_id, body=data.body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = db.query(models.PostComment).filter(models.PostComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    db.delete(comment)
    db.commit()
