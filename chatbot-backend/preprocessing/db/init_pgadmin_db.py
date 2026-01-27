## ONLY USE FOR LOCAL pgadmin connection ##
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, event, DDL, inspect
from models import Base

load_dotenv()
database_url = os.getenv("DATABASE_URL")
if database_url is None:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(database_url)

def init_db():
    # Enable vector extension before creating tables
    event.listen(
        Base.metadata, 
        'before_create', 
        DDL("CREATE EXTENSION IF NOT EXISTS vector")
    )
    
    # Create all tables and indexes (including HNSW from models.py)
    Base.metadata.create_all(engine)
    print("Tables and Indexes created successfully.")

def verify_setup():
    """Inspects the database to confirm tables and indexes exist."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\nFound Tables: {tables}")
    
    for table_name in tables:
        print(f"\nIndexes on '{table_name}':")
        indexes = inspector.get_indexes(table_name)
        for idx in indexes:
            print(f"- Name: {idx['name']}")
            print(f"  Columns: {idx['column_names']}")

if __name__ == "__main__":
    init_db()
    verify_setup()
