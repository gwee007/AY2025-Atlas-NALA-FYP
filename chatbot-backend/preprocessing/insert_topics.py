import os
import sys
sys.path.append(os.path.abspath(".."))
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from db.models import Topic
from dotenv import load_dotenv

# load_dotenv()
# POSTGRES_USER = os.getenv("POSTGRES_USER")
# POSTGRES_PASS = os.getenv("POSTGRES_PASS")
# POSTGRES_HOST = os.getenv("POSTGRES_HOST")
# POSTGRES_DB = os.getenv("POSTGRES_DB")
# POSTGRES_PORT = os.getenv("POSTGRES_PORT")

# database_url = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASS}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
# engine = create_engine(database_url)
load_dotenv()
database_url = os.getenv("DATABASE_URL")
if database_url is None:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(database_url)
Session = sessionmaker(bind=engine)
session = Session()

# remove all existing data from the "topics" table
session.query(Topic).delete()
session.commit()
print("All existing topics have been deleted.")

# read topic summary JSON file
with open("../../data/topic_summary.json", "r", encoding="utf-8") as f:
    topic_data = json.load(f)

for topic in topic_data:
    topic_name = topic["topic_name"]
    print(f"Processing topic: {topic_name}")
    
    new_topic = Topic(
        topic_name=topic_name
    )

    # insert topic into database
    try:
        session.add(new_topic)
        session.commit()
        print(f"Inserted topic: {topic_name}")
    except IntegrityError as e:
        session.rollback()
        print(f"Error inserting topic '{topic_name}': {e}")