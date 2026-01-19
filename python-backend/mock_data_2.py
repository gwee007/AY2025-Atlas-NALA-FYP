import random
import sys
import os

# Ensure we can import from the parent directory if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import sessionmaker, joinedload
from initialize_database import get_engine
from models import Question, Subtopic, Topic

# Setup Database Connection
engine = get_engine()
SessionLocal = sessionmaker(bind=engine)

def backfill_question_subtopics():
    session = SessionLocal()
    try:
        print("--- Starting Subtopic Backfill ---")
        
        # 1. Fetch all Subtopics and organize them by Topic ID
        # This acts as a lookup table: { topic_id: [subtopic_obj_1, subtopic_obj_2] }
        print("Fetching and grouping subtopics...")
        all_subtopics = session.query(Subtopic).all()
        subtopics_by_topic = {}
        
        for sub in all_subtopics:
            if sub.topic_id not in subtopics_by_topic:
                subtopics_by_topic[sub.topic_id] = []
            subtopics_by_topic[sub.topic_id].append(sub)
            
        print(f"Loaded subtopics for {len(subtopics_by_topic)} distinct topics.")

        # 2. Fetch all Questions (eager load topics and existing subtopics to avoid N+1 queries)
        print("Fetching questions...")
        questions = session.query(Question).options(
            joinedload(Question.topics),
            joinedload(Question.subtopics)
        ).all()
        
        print(f"Processing {len(questions)} questions...")
        
        updated_count = 0
        
        # 3. Iterate through questions and assign missing subtopics
        for q in questions:
            is_modified = False
            
            # Get IDs of subtopics already assigned to this question
            existing_subtopic_ids = {s.id for s in q.subtopics}
            
            # For each TOPIC this question belongs to...
            for topic in q.topics:
                # Find the list of valid subtopics for this specific topic
                valid_subtopics = subtopics_by_topic.get(topic.id, [])
                
                if not valid_subtopics:
                    print(f"[WARN] No subtopics found for Topic '{topic.topic_name}' (ID: {topic.id})")
                    continue
                
                # Check if the question is already linked to ANY subtopic from this topic
                # (Intersection check: Do any of the valid subtopics exist in the question's current subtopics?)
                has_subtopic_for_this_topic = any(s.id in existing_subtopic_ids for s in valid_subtopics)
                
                # If the question has the Topic, but NO Subtopic from that Topic, assign one.
                if not has_subtopic_for_this_topic:
                    random_subtopic = random.choice(valid_subtopics)
                    
                    # Use SQLAlchemy ORM to append (it handles the link table insertion)
                    q.subtopics.append(random_subtopic)
                    
                    # Update local tracking so we don't add duplicates in this loop
                    existing_subtopic_ids.add(random_subtopic.id)
                    is_modified = True
            
            if is_modified:
                updated_count += 1

        # 4. Commit changes
        if updated_count > 0:
            session.commit()
            print(f"\nSUCCESS: Updated {updated_count} questions with new subtopic associations.")
        else:
            print("\nNo updates needed. All questions already have valid subtopics.")

    except Exception as e:
        session.rollback()
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    backfill_question_subtopics()