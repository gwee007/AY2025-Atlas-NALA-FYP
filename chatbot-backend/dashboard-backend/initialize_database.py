import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from db.models import Base

load_dotenv()

def get_database_url():
    # Supabase usually provides a single connection string, 
    # but we can keep your variable structure:
    db_user = os.getenv("POSTGRES_USER")
    db_password = os.getenv("POSTGRES_PASS")
    db_host = os.getenv("POSTGRES_HOST")
    db_port = os.getenv("POSTGRES_PORT", "5432")
    db_name = os.getenv("POSTGRES_DB", "postgres")

    return f"postgresql+psycopg2://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# ✅ FIX: Create a SINGLE global engine instance
_engine = None

def get_engine():
    """
    Returns a singleton database engine with optimized connection pooling.
    Prevents connection pool exhaustion by reusing the same engine.
    """
    global _engine
    if _engine is None:
        database_url = get_database_url()
        print(f"🔧 Creating database engine with connection pooling...")
        _engine = create_engine(
            database_url,
            pool_size=5,           # Maximum number of permanent connections
            max_overflow=10,       # Maximum overflow connections beyond pool_size
            pool_pre_ping=True,    # Test connections before using
            pool_recycle=3600,     # Recycle connections after 1 hour
            echo=False
        )
        print(f"✅ Engine created with pool_size=5, max_overflow=10")
    return _engine

def initialize():
    """Initialize database tables and indexes."""
    engine = get_engine()  # Use the singleton engine
    print(f"Connecting to database...")
    
    # Supabase uses connection pooling (Port 6543 for transaction mode, 5432 for session)
    # For initial table creation, session mode (5432) is generally preferred.

    # 1. Enable pgvector (Supabase supports this by default!)
    # with engine.connect() as conn:
    #     print("Enabling pgvector extension...")
    #     conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    #     conn.commit()

    # 2. Create the tables
    Base.metadata.create_all(engine)

    # 3. Create the index (Now safe because extension is enabled)
    # Note: Using half_vec or different index types is also possible in newer pgvector versions
    with engine.connect() as conn:
        print("Creating vector index...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
            ON document_chunks 
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
        """))
        conn.commit()

    print("Database initialization complete.")
    return engine

if __name__ == "__main__":
    initialize()