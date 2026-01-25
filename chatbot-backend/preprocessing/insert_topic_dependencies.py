import os
import sys
sys.path.append(os.path.abspath(".."))
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from db.models import TopicDependency
from dotenv import load_dotenv

load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASS = os.getenv("POSTGRES_PASS")
POSTGRES_HOST = os.getenv("POSTGRES_HOST")
POSTGRES_DB = os.getenv("POSTGRES_DB")
POSTGRES_PORT = os.getenv("POSTGRES_PORT")

database_url = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASS}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
engine = create_engine(database_url)
Session = sessionmaker(bind=engine)
session = Session()

# remove all existing data from the "topic_dependencies" table
session.query(TopicDependency).delete()
session.commit()
print("All existing topic dependencies have been deleted.")

# insert topic dependencies
topic_dependencies = [
    {"topic_id": 1, "related_topic_id": 2, "relation_type": "prerequisite"},
    {"topic_id": 2, "related_topic_id": 4, "relation_type": "prerequisite"},
    {"topic_id": 3, "related_topic_id": 4, "relation_type": "prerequisite"},
    {"topic_id": 4, "related_topic_id": 6, "relation_type": "prerequisite"},
    {"topic_id": 5, "related_topic_id": 6, "relation_type": "prerequisite"},
    {"topic_id": 4, "related_topic_id": 5, "relation_type": "prerequisite"}
]

for dependency in topic_dependencies:
    try:
        new_dependency = TopicDependency(
            topic_id=dependency["topic_id"],
            related_topic_id=dependency["related_topic_id"],
            relation_type=dependency["relation_type"]
        )
        session.add(new_dependency)
        session.commit()
        print(f"Inserted dependency: {dependency['topic_id']} -> {dependency['related_topic_id']} ({dependency['relation_type']})")
    except IntegrityError as e:
        session.rollback()
        print(f"Failed to insert dependency: {e}")