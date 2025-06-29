from sqlalchemy.orm import Session
import models, schemas

def get_blogs(db: Session):
    return db.query(models.Blog).all()

def create_blog(db: Session, blog: schemas.BlogCreate):
    db_blog = models.Blog(title=blog.title, content=blog.content)
    db.add(db_blog)
    db.commit()
    db.refresh(db_blog)
    return db_blog