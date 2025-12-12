import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from db.models import TopicDependency
from dotenv import load_dotenv

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Database setup
def get_database_url():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is not set")
    return database_url

def create_session():
    engine = create_engine(get_database_url())
    return sessionmaker(bind=engine)()

# Insert topic dependency
def insert_topic_dependency(session, topic_id, related_topic_id, relation_type="related"):
    """
    Inserts a topic dependency into the database.

    :param session: SQLAlchemy session object
    :param topic_id: ID of the topic
    :param related_topic_id: ID of the related topic
    :param relation_type: Type of relationship (default is "related")
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

    # Sample data for inserting topic dependencies
    sample_dependencies = [
        {"topic_id": 1, "related_topic_id": 2, "relation_type": "prerequisite"},
        {"topic_id": 2, "related_topic_id": 3, "relation_type": "related"},
        {"topic_id": 3, "related_topic_id": 1, "relation_type": "dependent"}
    ]

    # Insert sample dependencies
    for dependency in sample_dependencies:
        insert_topic_dependency(
            session,
            topic_id=dependency["topic_id"],
            related_topic_id=dependency["related_topic_id"],
            relation_type=dependency["relation_type"]
        )

if __name__ == "__main__":
    main()