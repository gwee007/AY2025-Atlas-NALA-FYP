import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text
from models_simple import Base

def initialize():
    db_user = os.getenv("POSTGRES_USER")
    db_password = os.getenv("POSTGRES_PASS")
    db_host = os.getenv("POSTGRES_HOST")
    db_name = os.getenv("POSTGRES_DB")
    database_url = f"postgresql://{db_user}:{db_password}@{db_host}/{db_name}"

    if database_url is None:
        raise ValueError("DATABASE_URL environment variable is not set")
    engine = create_engine(database_url)

    # create the 4 tables defined in db.models
    Base.metadata.create_all(engine)

    # Note: pgvector extension and embedding index temporarily disabled
    # Uncomment when pgvector is installed and Vector columns are enabled:
    # with engine.connect() as conn:
    #     print("Enabling pgvector extension if not exists...")
    #     conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    #     conn.commit()
    
    # with engine.connect() as conn:
    #     conn.execute(text("""
    #     CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
    #     ON document_chunks
    #     USING ivfflat (embedding vector_cosine_ops)
    #     WITH (lists = 100);
    #     """))
    #     conn.commit()

    print("Tables created.")
    return engine

def get_engine():
    db_user = os.getenv("POSTGRES_USER")
    db_password = os.getenv("POSTGRES_PASS")
    db_host = os.getenv("POSTGRES_HOST")
    db_name = os.getenv("POSTGRES_DB")
    database_url = f"postgresql://{db_user}:{db_password}@{db_host}/{db_name}"

    if database_url is None:
        raise ValueError("DATABASE_URL environment variable is not set")
    engine = create_engine(database_url)
    return engine

if __name__ == "__main__":
    initialize()
