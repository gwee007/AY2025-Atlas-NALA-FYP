from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import Config
import logging

logger = logging.getLogger(__name__)

try:
    engine = create_engine(
        Config.DATABASE_URL, 
        pool_pre_ping=True,  # Test connections before using
        pool_recycle=3600,   # Recycle connections every hour
        max_overflow=10,     # Max overflow connections
        echo=False           # Set to True for SQL debugging
    )
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()