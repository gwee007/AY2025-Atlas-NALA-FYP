import os
from dotenv import load_dotenv

load_dotenv()

class Config:    
    # SUPABASE
    POSTGRES_USER = os.environ.get("POSTGRES_USER")
    POSTGRES_PASS = os.environ.get("POSTGRES_PASS")
    POSTGRES_HOST = os.environ.get("POSTGRES_HOST")
    POSTGRES_DB = os.environ.get("POSTGRES_DB")
    POSTGRES_PORT = os.environ.get("POSTGRES_PORT", 5432)
    
    DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASS}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    
    # POSTGRES (LOCAL)
    # DATABASE_URL = os.environ.get("DATABASE_URL")
    
    # NALA API
    NALA_API_KEY = os.environ.get("NALA_API_KEY")
    NALA_BASE_URL = os.environ.get("NALA_BASE_URL")

