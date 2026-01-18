## ONLY USE FOR LOCAL pgadmin connection ##
import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text
from models import Base

database_url = os.getenv("DATABASE_URL")
if database_url is None:
    raise ValueError("DATABASE_URL environment variable is not set")
engine = create_engine(database_url)

def init_db():
    # create the 4 tables defined in db.models
    Base.metadata.create_all(engine)

    # Enable pgvector extension (if not exists)
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()

    # Create IVFFlat index for document_chunks.embedding
    with engine.connect() as conn:
        conn.execute(text("""
        CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
        ON document_chunks
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
        """))
        conn.commit()

    print("Tables and IVFFlat index created.")

if __name__ == "__main__":
    init_db()
