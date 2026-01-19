import os
import json 
from datetime import datetime, timedelta
import random
from sqlalchemy import MetaData
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# --- IMPORTS ---
from initialize_database import get_engine
from models import (
    Base, User, Conversation, Message, Question, Answer,
    Topic, TopicDependency, Subtopic, DocumentChunk,
    question_topics, question_subtopics
)

load_dotenv()

engine = get_engine()
SessionLocal = sessionmaker(bind=engine)

def cleanup_old_tables():
    print("We need to rethink this...")
    # metadata = MetaData()
    # metadata.reflect(bind=engine, schema='public')
    # metadata.drop_all(bind=engine)
    print("Clean slate complete.")

# --- DATA LOADING ---
def load_data_from_files():
    base_dir = os.path.dirname(__file__)
    
    # 1. Load Topics
    topics_path = os.path.join(base_dir, 'mock_data', 'topic_summary', 'topic_summary.json')
    with open(topics_path, 'r', encoding='utf-8') as f:
        topics_data = json.load(f)
    print(f"Loaded {len(topics_data)} topics from file.")

    # 2. Load Subtopics
    subtopics_data = []
    sub_dir = os.path.join(base_dir, 'mock_data', 'subtopic_summary') # Ensure folder name matches exactly
    
    if os.path.exists(sub_dir):
        for fname in os.listdir(sub_dir):
            if fname.endswith('.json'):
                try:
                    with open(os.path.join(sub_dir, fname), 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        # Since your JSON has "topic_id" inside, we can extend directly
                        if isinstance(data, list):
                            subtopics_data.extend(data)
                        else:
                            subtopics_data.append(data)
                except Exception as e:
                    print(f"Error loading {fname}: {e}")
    
    print(f"Loaded {len(subtopics_data)} subtopics from files.")
    return topics_data, subtopics_data

# --- CONVERSATION GENERATOR ---
def create_conversation_flow(session, user_obj, topics_objs, subtopics_objs, is_complex=False):
    # Create Conversation
    conv = Conversation(
        user_id=user_obj.id,
        title=f"{'Complex' if is_complex else 'Simple'} Chat {random.randint(100,999)}",
        last_accessed=datetime.utcnow() 
    )
    session.add(conv)
    session.flush()
    
    # Create Interactions
    for i in range(random.randint(3, 5)):
        timestamp = datetime.utcnow() - timedelta(days=random.randint(0, 30))
        
        # User Message
        user_msg = Message(
            conversation_id=conv.id,
            sender="user",
            content=f"Question {i} from {user_obj.name}",
            timestamp=timestamp
        )
        session.add(user_msg)
        session.flush()
        
        # Question
        grade = random.choice(["A", "B", "C", "D", "F"])
        solo = random.choice(["Relational", "Multistructural", "Unistructural"])
        
        timestamp_create = timestamp + timedelta(days=random.randint(0,5), seconds=10)
        timestamp_update = timestamp_create + timedelta(days=random.randint(0,5), seconds=10)
        question = Question(
            message_id=user_msg.id,
            grade=grade,
            reasoning="Auto reasoning",
            status="ANSWERED",
            solo_taxonomy_level=solo,
            created_at= timestamp_create,
            updated_at= timestamp_update
        )
        session.add(question)
        session.flush()
        
        # M2M Relationships
        if topics_objs:
            if is_complex and len(topics_objs) >= 2:
                # Assign 2 Topics
                t1, t2 = topics_objs[0], topics_objs[1]
                session.execute(question_topics.insert().values([
                    {"question_id": question.id, "topic_id": t1.id},
                    {"question_id": question.id, "topic_id": t2.id}
                ]))
                
                # Assign corresponding subtopics if they exist
                s1 = next((s for s in subtopics_objs if s.topic_id == t1.id), None)
                s2 = next((s for s in subtopics_objs if s.topic_id == t2.id), None)
                
                subs_vals = []
                if s1: subs_vals.append({"question_id": question.id, "subtopic_id": s1.id})
                if s2: subs_vals.append({"question_id": question.id, "subtopic_id": s2.id})
                
                if subs_vals:
                    session.execute(question_subtopics.insert().values(subs_vals))
            else:
                # Assign 1 Random Topic
                t = random.choice(topics_objs)
                session.execute(question_topics.insert().values(question_id=question.id, topic_id=t.id))
                
                # Assign 1 Random Subtopic belonging to that topic
                valid_subs = [s for s in subtopics_objs if s.topic_id == t.id]
                if valid_subs:
                    s = random.choice(valid_subs)
                    session.execute(question_subtopics.insert().values(question_id=question.id, subtopic_id=s.id))

        # Bot Answer
        bot_msg = Message(
            conversation_id=conv.id,
            sender="bot",
            content=f"Answer to Q{i}",
            timestamp=timestamp + timedelta(seconds=15)
        )
        session.add(bot_msg)
        session.flush()
        
        # Answer Record
        answer = Answer(
            question_id=question.id,
            message_id=bot_msg.id,
            created_at = timestamp + timedelta(minutes=random.randint(0,15)),
            accuracy_score=random.randint(50, 100),
            feedback="Bot feedback"
        )
        session.add(answer)
        session.flush()

# --- MAIN POPULATION LOGIC ---
def populate_mock_data():
    session = SessionLocal()
    try:
        # cleanup_old_tables()
        print("Creating new schema...")
        Base.metadata.create_all(engine)
        
        # 1. Load Data
        TOPICS_DATA, SUBTOPICS_DATA = load_data_from_files()
        
        # 2. Create Topics
        print("Creating topics...")
        topics_objs = []
        for t_data in TOPICS_DATA:
            topic = Topic(
                id=t_data['id'],
                topic_name=t_data['topic_name'], # Corrected key
                topic_summary=t_data['topic_summary'] # Corrected key
            )
            topics_objs.append(topic)


        # 3. Create Subtopics
        print("Creating subtopics...")
        subtopics_objs = []
        # We DO NOT set 'id' manually. We let the database auto-increment.
        # We capture the created objects in subtopics_objs to get their IDs later.
        for s_data in SUBTOPICS_DATA:
            sub = Subtopic(
                topic_id=s_data['topic_id'],
                subtopic_name=s_data['subtopic_name'], # Corrected key from your JSON
                subtopic_summary=s_data['subtopic_summary'], # Corrected key from your JSON
                subtopic_summary_embedding=[0.0]*1024
            )
            
            subtopics_objs.append(sub)
        
        
        # # 4. Create Topic Dependencies
        # print("Creating dependencies...")
        # # Hardcoded for now based on your previous code
        # TOPIC_DEPENDENCIES = [
        #     {"topic_id": 4, "related_topic_id": 2, "relation_type": "prerequisite"},
        #     {"topic_id": 4, "related_topic_id": 3, "relation_type": "prerequisite"},
        #     {"topic_id": 5, "related_topic_id": 4, "relation_type": "prerequisite"},
        # ]
        
        # # Safe insert: check if IDs exist
        # existing_topic_ids = {t.id for t in topics_objs}
        # for dep in TOPIC_DEPENDENCIES:
        #     if dep['topic_id'] in existing_topic_ids and dep['related_topic_id'] in existing_topic_ids:
        #         td = TopicDependency(
        #             topic_id=dep['topic_id'],
        #             related_topic_id=dep['related_topic_id'],
        #             relation_type=dep['relation_type']
        #         )
        #         session.add(td)
        # session.flush()

        # # 5. Create Document Chunks (CORRECTED LOOP)
        # print("Creating document chunks...")
        # # Iterate over the OBJECTS, not a range index.
        # # This ensures 'sub' is the correct object with a valid DB ID.
        # for sub in subtopics_objs:
        #     chunk = DocumentChunk(
        #         subtopic_id=sub.id, # Uses real ID from DB
        #         content=f"Content for {sub.subtopic_name}",
        #         embedding=[0.1]*1024 ,
        #         created_at  = datetime.utcnow(),
        #         updated_at  = datetime.utcnow()
        #     )
        #     session.add(chunk)
        # session.flush()

        # 6. Create Users
        print("Creating Users...")
        user_complex = User(id=101, name="Complex User", email="complex@test.com", hashed_password="pw")
        user_simple = User(id=102, name="Simple User", email="simple@test.com", hashed_password="pw")
        user_empty = User(id=103, name="Empty User", email="empty@test.com", hashed_password="pw")

        for user in [user_complex, user_simple, user_empty]:
            session.merge(user)
        session.flush()

        # 7. Generate Conversations
        print("Populating Complex User 101...")
        for _ in range(3):
            create_conversation_flow(session, user_complex, topics_objs, subtopics_objs, is_complex=True)

        print("Populating Simple User 102...")
        for _ in range(3):
            create_conversation_flow(session, user_simple, topics_objs, subtopics_objs, is_complex=False)

        # 8. Create Persona Users (104-113)
        print("Populating Persona Users (104-113)...")
        for i in range(10):
            uid = 104 + i
            u = User(id=uid, name=f"Persona User {uid}", email=f"user{uid}@test.com", hashed_password="pw")
            session.add(u)
            session.flush()
            # Add random conversations
            for _ in range(random.randint(1, 4)):
                create_conversation_flow(session, u, topics_objs, subtopics_objs, is_complex=False)

        session.commit()
        print("\nSUCCESS: Database populated successfully.")
        print("User 101: Complex Data")
        print("User 102: Simple Data")
        print("User 103: No Data")

    except Exception as e:
        session.rollback()
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    populate_mock_data()