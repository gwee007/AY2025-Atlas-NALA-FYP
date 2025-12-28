import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from models import TopicDependency
from dotenv import load_dotenv

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Database setup
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASS = os.getenv("POSTGRES_PASS")
POSTGRES_HOST = os.getenv("POSTGRES_HOST")
POSTGRES_DB = os.getenv("POSTGRES_DB")
POSTGRES_PORT = os.getenv("POSTGRES_PORT")

# Initialise database URL
database_url = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASS}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

def create_session():
    engine = create_engine(database_url)
    return sessionmaker(bind=engine)()

# Insert topic dependency
def insert_topic_dependency(session, topic_id, related_topic_id, relation_type):
    """
    Inserts a topic dependency into the database.
    """
    try:
        dependency = TopicDependency(
            topic_id=topic_id,
            related_topic_id=related_topic_id,
            relation_type=relation_type
        )
        session.add(dependency)
        session.commit()
        print(f"Inserted dependency: {topic_id} -> {related_topic_id} ({relation_type})")
    except IntegrityError as e:
        session.rollback()
        print(f"Failed to insert dependency: {e}")

# Main function
def main():
    session = create_session()

    topic_dependencies = [
        {"topic_id": 4, "related_topic_id": 2, "relation_type": "prerequisite"},
        {"topic_id": 4, "related_topic_id": 3, "relation_type": "prerequisite"},
        {"topic_id": 5, "related_topic_id": 4, "relation_type": "prerequisite"},
        {"topic_id": 6, "related_topic_id": 4, "relation_type": "prerequisite"},
        {"topic_id": 6, "related_topic_id": 5, "relation_type": "prerequisite"}
    ]

    for dependency in topic_dependencies:
        insert_topic_dependency(
            session,
            topic_id=dependency["topic_id"],
            related_topic_id=dependency["related_topic_id"],
            relation_type=dependency["relation_type"]
        )

if __name__ == "__main__":
    main()