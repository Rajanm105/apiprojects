from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import models, schemas, crud
from database import engine, SessionLocal

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "Welcome to the Blog API!"}

@app.get("/blogs", response_model=list[schemas.Blog])
def read_blogs(db: Session = Depends(get_db)):
    return crud.get_blogs(db)

@app.post("/blogs", response_model=schemas.Blog)
def create_blog(blog: schemas.BlogCreate, db: Session = Depends(get_db)):
    return crud.create_blog(db, blog)