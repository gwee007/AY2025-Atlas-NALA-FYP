import requests
import os
import pandas as pd
import psycopg2
from psycopg2 import sql
# Importing the modules from another file.
from models_simple import Base, Chatbot, User, Conversation, Message, Question, Answer 
from sqlalchemy import create_engine,inspect,text
from sqlalchemy.orm import sessionmaker

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

Session = sessionmaker(bind=engine)

session= Session()
for table_name in inspector.get_table_names():
    columns = inspector.get_columns(table_name)

    print(f"Table: {table_name}")
    for column in columns:
        print(f"  Column: {column['name']} - Type: {column['type']}")
    try: 
        result=session.execute(text(f"SELECT * FROM {table_name} LIMIT 5")).fetchall()
        print(f" First 5 rows of {table_name}:")
        for row in result:
            print(row)
    except Exception as e:
        print(f" Could not fetch data from {table_name}: {e}")

session.close()

