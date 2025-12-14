import requests
import os
import pandas as pd
import psycopg2
from psycopg2 import sql
# Importing the modules from another file.
from models_simple import Base, Chatbot, User, Conversation, Message, Question, Answer 
from sqlalchemy import create_engine, inspect, text

from dotenv import load_dotenv
load_dotenv()

# Postgres temporary details 
db_user = os.getenv("POSTGRES_USER")
db_password = os.getenv("POSTGRES_PASS")
db_host = os.getenv("POSTGRES_HOST")
db_name = os.getenv("POSTGRES_DB")

try: 
    connection = psycopg2.connect(
        user=db_user,
        password=db_password,
        host=db_host,
        database=db_name
    )
    # Hopefully it works now. 
    print("Database connection attempted with the database, the database, the... is successful.")
    
except Exception as e:
    print("Error connecting to the database:", e)


def inspect_database(engine):
    inspector=inspect(engine)
    print("Inspecting the database...")
    print(inspector.get_table_names())
    for table_name in inspector.get_table_names():
        columns = inspector.get_columns(table_name)
        print(f"Table: {table_name}")
        for column in columns:
            print(f"  Column: {column['name']} - Type: {column['type']}")
        try: 
            
            result=session.execute(text(f"SELECT * FROM \"{table_name}\" LIMIT 5")).fetchall()
            print(f" First 5 rows of {table_name}:")
            for row in result:
                print(row)
        except Exception as e:
            print(f" Could not fetch data from {table_name}: {e}")

# Create SQL alchemy engine using database url
database_url = f"postgresql://{db_user}:{db_password}@{db_host}/{db_name}"
engine = create_engine(database_url)
# Create all tables defined in models_simple.py
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)
# Print out message to signify that we're done at this stage.
print("Database tables created successfully.")

# Load environment variables for the API
api_key = os.getenv("NALA_API_KEY")
base_url = os.getenv("BASE_URL")  
print("API Key:", api_key)
print("Base URL:", base_url)

# Define the endpoint URL
url = f"{base_url}/api/chatbot/3/conversations"
headers = {
    "Authorization": f"Bearer {api_key}"
}
headers = {
    "Authorization": f"Bearer {api_key}"
    
}
chat_history_api = f"{base_url}/api/chathistory"

# Send the POST request
response = requests.post(url, headers=headers)

# Check if the response status code is 200
if response.status_code == 200:
    try:
        # Parse the JSON response
        response_json = response.json()
        print("JSON successfully parsed.")
        from sqlalchemy.orm import sessionmaker
        session_local = sessionmaker(bind=engine)
        session = session_local()
        chatbot= Chatbot(
            chatbot_id=3,
            users_count=response_json.get("users_count", 0)
        )
        session.merge(chatbot)
        session.flush()  # Flush to get chatbot_id if needed
        for user_record in response_json.get("users", []):
            user= User(
                user_id=user_record.get("user_id"),
                conversations_count=user_record.get("conversations_count"),
                chatbot_id=3
            )
            print("username: ", user.user_id, "gotten from ", user_record.get("user_id"))
            print("user record here: ", user_record)
            session.merge(user)
            session.flush()

            conversations= user_record.get("conversations", [])
            for convo_record in conversations:
                conversation = Conversation(
                    id=convo_record.get("id"),
                    title=convo_record.get("title"),
                    created_at=convo_record.get("created_at"),
                    updated_at=convo_record.get("updated_at"),
                    # messages=convo_record.get("messages", []),
                    user_id=user_record.get("user_id")
                )
                session.merge(conversation)
                session.flush()
        session.commit() 
        print("Data commited to the database") 
        inspect_database(engine)

                  # Use merge to avoid duplicates
    except ValueError:
        print("Failed to parse JSON response.")
        print("Response Text:", response.text)
        
else:
    print("Request failed with status code:", response.status_code)
    print("Response Body:", response.text)





# Convert to pandas DataFrame

# df = pd.DataFrame(data)
# print(df.head())
# print("DataFrame created with shape:", df.shape)

# Plan: Get a postgres install on your computer
# Connect to the database using our current models_simple.py structure


# For the chatbot, transfer this first with the users count and users


# Users table. 
# Conversations table.
# Messages table.
# Questions table
# Answers table