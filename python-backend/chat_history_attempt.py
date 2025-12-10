import requests
import os
import pandas as pd
import psycopg2
from psycopg2 import sql
# Importing the modules from another file.
from models_simple import Base, Chatbot, User, Conversation, Message, Question, Answer 
from sqlalchemy import create_engine,inspect

from dotenv import load_dotenv
load_dotenv()

# Postgres temporary details 
db_user = os.getenv("POSTGRES_USER")
db_password = os.getenv("POSTGRES_PASS")
db_host = os.getenv("POSTGRES_HOST")
db_name = os.getenv("POSTGRES_DB")
# Create SQL alchemy engine using database url
database_url = f"postgresql://{db_user}:{db_password}@{db_host}/{db_name}"
engine = create_engine(database_url)

inspector=inspect(engine)
print(inspector.get_table_names())
