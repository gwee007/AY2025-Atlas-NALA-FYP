from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from app.config import Config
import logging

logger = logging.getLogger(__name__)

try:
    engine = create_engine(
        Config.DATABASE_URL,
        pool_size=10,           
        max_overflow=30,        
        pool_pre_ping=True,     # Test connections before using
        pool_recycle=3600,      # Recycle connections every hour to prevent stale connections
        pool_timeout=30,        # Timeout for getting connection from pool (seconds)
        echo=False              # Set to True for SQL debugging
    )
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    raise

# using scoped sessions to manage sessions in multi-threaded environments
session_factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
SessionLocal = scoped_session(session_factory)

def get_db():
    """
    Context manager for database sessions.
    Ensures proper cleanup even if exceptions occur.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_session():
    """
    Direct session provider for non-generator contexts.
    Caller is responsible for closing the session.
    """
    return SessionLocal()