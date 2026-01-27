import os 
from dotenv import load_dotenv
from sqlalchemy import create_engine, event, DDL, inspect
from sqlalchemy.schema import Index
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

def setup_database():
    # enable vector extension
    event.listen(
        Base.metadata, 
        'before_create', 
        DDL("CREATE EXTENSION IF NOT EXISTS vector")
    )
    Base.metadata.create_all(engine)
    print("Tables and Indexes created successfully.")

def verify_setup():
    """Inspects the database to confirm tables and indexes exist."""
    inspector = inspect(engine)
    
    # check all tables created andd thir indexes
    tables = inspector.get_table_names()
    print(f"\nFound Tables: {tables}")
    
    for table_name in tables:
        print(f"\nIndexes on '{table_name}':")
        indexes = inspector.get_indexes(table_name)
        for idx in indexes:
            print(f"- Name: {idx['name']}")
            print(f"  Columns: {idx['column_names']}")

def drop_index(table_name, index_name):
    """Drops a specific index from a table."""
    inspector = inspect(engine)
    indexes = inspector.get_indexes(table_name)
    
    # Check if the index exists
    if any(idx['name'] == index_name for idx in indexes):
        with engine.connect() as connection:
            print(f"Dropping index: {index_name} from table: {table_name}")
            idx = Index(index_name)
            idx.drop(connection)
            print(f"Index '{index_name}' has been dropped.")
    else:
        print(f"Index '{index_name}' does not exist on table '{table_name}'.")

if __name__ == "__main__":
    try:
        setup_database()
        verify_setup()
        # drop_index("subtopics", "subtopics_summary_embedding_idx")
    except Exception as e:
        print(f"An error occurred: {e}")
