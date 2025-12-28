import os 
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from models import Base

load_dotenv()
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASS = os.getenv("POSTGRES_PASS")
POSTGRES_HOST = os.getenv("POSTGRES_HOST")
POSTGRES_DB = os.getenv("POSTGRES_DB")
POSTGRES_PORT = os.getenv("POSTGRES_PORT")

if not all([POSTGRES_USER, POSTGRES_PASS, POSTGRES_HOST, POSTGRES_DB, POSTGRES_PORT]):
    raise ValueError("One or more PostgreSQL environment variables are not set")

database_url = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASS}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
engine = create_engine(database_url)

def check_table_content(table_name):
    """Check and print the content of a specific table."""
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT * FROM {table_name}"))
        rows = result.fetchall()
        if rows:
            print(f"Content of table '{table_name}':")
            for row in rows:
                print(row)
        else:
            print(f"Table '{table_name}' is empty.")

def check_indexes(table_name):
    """Check and print all indexes for a specific table."""
    query = text("""
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = :table_name
    """)
    with engine.connect() as conn:
        result = conn.execute(query, {"table_name": table_name})
        indexes = result.fetchall()
        if indexes:
            print(f"Indexes for table '{table_name}':")
            for index in indexes:
                print(f"- {index[0]}")
        else:
            print(f"No indexes found for table '{table_name}'.")

def create_tables_and_index():
    """Create tables and add the IVFFlat index for embeddings."""
    print("Creating tables...")
    Base.metadata.create_all(engine)
    print("Tables created successfully.")

    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()
        print("pgvector extension enabled.")

    # Create IVFFlat index for document_chunks.embedding
    with engine.connect() as conn:
        conn.execute(text("""
        CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
        ON document_chunks
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
        """))
        conn.commit()
        print("IVFFlat index created for document_chunks.embedding.")

if __name__ == "__main__":
    # Check content of the 'topics' table
    # check_table_content("topics")
        
    # Create tables and add the IVFFlat index
    create_tables_and_index()

    # check indexes of document_chunks table
    check_indexes("document_chunks")
