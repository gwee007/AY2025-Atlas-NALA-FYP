import requests
import os
import json
import pandas as pd
import psycopg2
from psycopg2 import sql
# Importing the modules from another file.
from models_simple import Base, Chatbot, User, Conversation, Message, Question, Answer, TopicDependency
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from sqlalchemy import create_engine
from models_simple import User, Conversation, Message, Question, Answer, Chatbot
from dotenv import load_dotenv
from initialize_database import get_engine   
import os
from dotenv import load_dotenv
load_dotenv()

# Purpose of this will be to synch the conversations API data with our local database


# NALA API details
NALA_API_KEY = os.getenv("NALA_API_KEY")
BASE_URL = os.getenv("BASE_URL")  # for NALA endpoint
CONVO_URL = f"{BASE_URL}/api/chatbot/3/conversations" # environment variable is not working i think, might have to remove it 
# success= False
# api/health

headers={
    "Authorization" : f"Bearer {NALA_API_KEY}"
}
try:
    response=  requests.get(f"{BASE_URL}/api/health", headers=headers)
    if response.status_code == 200:
        print("Successfully connected to NALA API.")
        # success= True
    else:
        print("Failed to connect to NALA API. Status code:", response.status_code)
        exit(1)
except Exception as e:
    print("Error connecting to NALA API:", e)
    exit(1)

try: 
    response= requests.post(CONVO_URL, headers=headers)
    if response.status_code == 200:
        print("Successfully fetched conversations data.")
        data= response.json()
        data_string = json.dumps(data)
        # convert data to string for printing (FOR DEBUG)
        print("Data fetched:", data)
        
    else:
        print("Failed to fetch conversations data. Status code:", response.status_code)
        exit(1)
except Exception as e:
    print("Error fetching conversations data:", e)
    exit(1)

# starting database
engine= get_engine()
SessionLocal= sessionmaker(autocommit=False, autoflush=False, bind=engine)
session= SessionLocal()

# Resolving chatbot id, for sanity's sake
chatbot_id = data["chatbot_id"] if "chatbot_id" in data else 3
users_count = data["users_count"] if "users_count" in data else 0
chatbot= Chatbot(
    chatbot_id=chatbot_id,
    users_count=users_count
)
# just using users for now
session.merge(chatbot)
session.flush()  # Flush to get chatbot_id if needed

user_data= data.get("users", [])
try:
    for user_record in user_data:
        user= User(
            user_id=user_record.get("user_id"),
            conversations_count=user_record.get("conversations_count"),
            chatbot_id=chatbot_id
        )
        print("username: ", user.user_id, "gotten from ", user_record.get("user_id"))
        print("user record here: ", user_record)
        session.merge(user)
        session.flush()
        session.commit()
    
        conversations= user_record.get("conversations", [])
        for convo_record in conversations:
            conversation = Conversation(
                id=convo_record.get("id"),
                title=convo_record.get("title"),
                created_at=convo_record.get("created_at"),
                updated_at=convo_record.get("updated_at"),
                #messages=convo_record.get("messages", []),
                user_id=user_record.get("user_id")
            )
            session.merge(conversation)
            session.flush()
            session.commit()
            for message_record in convo_record.get("messages", []):
                message = Message(
                    id=message_record.get("id"),
                    conversation_id=convo_record.get("id"),
                    sender=message_record.get("sender"),
                    content=message_record.get("content"),
                    timestamp=message_record.get("timestamp")
                )
                session.merge(message)
                session.flush()
                session.commit()
    session.close()
except Exception as ex:
    print("Error during database insertion:", ex)
    session.rollback() # good idea I guess
    session.close()
    exit(1)
# 

print("Database update complete.")