"""
Database connection and session management using SQLAlchemy.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from dotenv import load_dotenv
from db.models import Base

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/nala')

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True  # Verify connections before using them
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create thread-safe scoped session
Session = scoped_session(SessionLocal)


def init_db():
    """
    Initialize database by creating all tables.
    Run this once to set up the schema.
    """
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")


def get_db():
    """
    Get a database session.
    Use this in a context manager or close the session after use.
    
    Usage:
        with get_db() as db:
            users = db.query(User).all()
    """
    db = Session()
    try:
        yield db
    finally:
        db.close()


def get_db_session():
    """
    Get a database session directly.
    Remember to close the session after use!
    
    Usage:
        db = get_db_session()
        users = db.query(User).all()
        db.close()
    """
    return Session()


def close_db():
    """Close all database connections"""
    Session.remove()
    engine.dispose()


if __name__ == "__main__":
    # Test database connection
    print("Testing database connection...")
    try:
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
            print("✅ Database connection successful!")
            
        # Optionally create tables
        create_tables = input("\nCreate database tables? (y/n): ")
        if create_tables.lower() == 'y':
            init_db()
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
