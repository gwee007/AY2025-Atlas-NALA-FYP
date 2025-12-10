import requests
import os
import pandas as pd
import psycopg2
from psycopg2 import sql
import datetime
# Importing the modules from another file.
from models_simple import Base, Chatbot, User, Conversation, Message, Question, Answer 
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
# querying the database
from dotenv import load_dotenv
load_dotenv()

# Postgres temporary details 
db_user = os.getenv("POSTGRES_USER")
db_password = os.getenv("POSTGRES_PASS")
db_host = os.getenv("POSTGRES_HOST")
db_name = os.getenv("POSTGRES_DB")
# print(db_user, db_password, db_host, db_name)
# Create SQL alchemy engine using database url
database_url = f"postgresql://{db_user}:{db_password}@{db_host}/{db_name}"
print("Database URL:", database_url)
engine = create_engine(database_url)

session= sessionmaker(bind=engine)()
conversation_duration= session.execute(text("SELECT AVG(created_at-updated_at) FROM \"conversation\" LIMIT 5")).fetchall()

for row in conversation_duration:
    print(row) # now we have average duration of conversation

conversation_number= session.execute(text("SELECT COUNT(*) FROM \"conversation\" GROUP BY user_id")).fetchall()
conversation_number_average = session.execute(text("SELECT AVG(conversation_count) FROM (SELECT COUNT(*) AS conversation_count FROM \"conversation\" GROUP BY user_id) AS subquery")).fetchall()
print("Number of conversations per user:")

for row in conversation_number:
    print(row) # now we have number of conversations
print("Average number of conversations per user:", conversation_number_average)

