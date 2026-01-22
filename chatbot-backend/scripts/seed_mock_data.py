"""
Script to populate database with mock data for testing.
Creates 5 test users with conversations, messages, questions, and answers over 9 days.
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path
import random
from sqlalchemy import text, func

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.session import get_db_session
from app.database.models import (
    User, Conversation, Message, Question, Answer, 
    Topic, Subtopic, question_topics, question_subtopics
)


def seed_mock_data():
    """Populate database with mock test data."""
    session = get_db_session()
    
    try:
        # Check if mock data already exists
        existing_test_user = session.query(User).filter(
            User.name.like('test_user_%')
        ).first()
        
        if existing_test_user:
            print("❌ Mock data already exists! Run cleanup script first.")
            return
        
        print("🌱 Starting mock data population...")
        

        
        # Get available topics and subtopics
        topics = session.query(Topic).all()
        subtopics = session.query(Subtopic).all()
        
        if not topics:
            print("⚠️  No topics found in database. Please initialize topics first.")
            session.close()
            return
        
        # Create a mapping of topics to their subtopics
        topic_subtopics_map = {}
        for topic in topics:
            topic_subtopics_map[topic.id] = session.query(Subtopic).filter(
                Subtopic.topic_id == topic.id
            ).all()
        
        # Grade options for questions and answers
        grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F']
        taxonomy_levels = ['Unistructural', 'Multistructural', 'Relational', 'Extended Abstract']
        
        # Create 5 test users
        test_users = []
        user_configs = [
            {'name': 'test_user_1', 'email': 'test1@example.com', 'conversations_per_day': 1},
            {'name': 'test_user_2', 'email': 'test2@example.com', 'conversations_per_day': 1},
            {'name': 'test_user_3', 'email': 'test3@example.com', 'conversations_per_day': 1},
            {'name': 'test_user_4', 'email': 'test4@example.com', 'conversations_per_day': 1},
            {'name': 'test_user_5', 'email': 'test5@example.com', 'conversations_per_day': 1},
        ]
        
        # Time range: 9 days (8 days ago to today)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=8)
        num_days = 9
        
        for user_config in user_configs:
            user = User(
                id = 200 + len(test_users),
                name=user_config['name'],
                email=user_config['email'],
                hashed_password='hashed_password_placeholder',
                created_at=start_date
            )
            session.add(user)
            session.flush()
            test_users.append(user)
            print(f"✅ Created user: {user.name}")
        
        session.commit()
        
        # Create conversations and messages for each user
        total_questions = 0
        total_answers = 0
        total_subtopic_mappings = 0
        
        # Create conversations for each day for each user
        for user_idx, user in enumerate(test_users):
            conversations_per_day = user_configs[user_idx]['conversations_per_day']
            
            # Create conversations for each of the 9 days
            for day_offset in range(num_days):
                conv_date = start_date + timedelta(days=day_offset)
                day_end = conv_date.replace(hour=23, minute=59, second=59, microsecond=0)
                
                # Create 1 conversation per day for consistent data
                for conv_idx in range(conversations_per_day):
                    conv_start = conv_date + timedelta(
                        hours=random.randint(8, 20),
                        minutes=random.randint(0, 59),
                        seconds=random.randint(0, 50)
                    )
                    current_ts = conv_start
                    conversation = Conversation(
                        user_id=user.id,
                        title=f"Day {day_offset + 1} - Conversation {conv_idx + 1}",
                        last_accessed=conv_start
                    )
                    session.add(conversation)
                    session.flush()
                    
                    # Create 3-6 message pairs (user question + assistant answer)
                    num_pairs = random.randint(3, 6)
                    
                    print(f"   Creating conversation for {user.name} on day {day_offset + 1} with {num_pairs} message pairs")
                    
                    if num_pairs == 0:
                        print(f"   ⚠️ WARNING: Conversation has 0 message pairs! Skipping...")
                        continue
                    
                    for pair_idx in range(num_pairs):
                        # Use current timestamp without clamping to allow natural duration
                        msg_date = current_ts
                        
                        # Create user message (question)
                        user_message = Message(
                            conversation_id=conversation.id,
                            content=f"User question {pair_idx + 1}: What is the concept?",
                            sender='user',
                            timestamp=msg_date
                        )
                        session.add(user_message)
                        session.flush()
                        
                        # Create question for user message
                        question = Question(
                            message_id=user_message.id,
                            solo_taxonomy_level=random.choice(taxonomy_levels),
                            grade=random.choice(grades),
                            reasoning=f"Mock reasoning for question {pair_idx + 1}",
                            status='ANSWERED',
                            created_at=msg_date
                        )
                        session.add(question)
                        session.flush()
                        
                        # Assign random topics to question (1-3 topics)
                        assigned_topics = random.sample(topics, k=min(random.randint(1, 3), len(topics)))
                        for topic in assigned_topics:
                            stmt = question_topics.insert().values(
                                question_id=question.id,
                                topic_id=topic.id
                            )
                            session.execute(stmt)
                            
                            # For each topic assigned, also assign its subtopics
                            topic_subs = topic_subtopics_map.get(topic.id, [])
                            if topic_subs:
                                # Assign 1-3 subtopics from this topic (or all if fewer)
                                num_subtopics = min(random.randint(1, 3), len(topic_subs))
                                assigned_subtopics = random.sample(topic_subs, k=num_subtopics)
                                
                                for subtopic in assigned_subtopics:
                                    stmt = question_subtopics.insert().values(
                                        question_id=question.id,
                                        subtopic_id=subtopic.id
                                    )
                                    session.execute(stmt)
                                    total_subtopic_mappings += 1
                        
                        total_questions += 1
                        
                        # Create assistant message (answer)
                        assistant_message = Message(
                            conversation_id=conversation.id,
                            content=f"Assistant answer {pair_idx + 1}: Here is the explanation...",
                            sender='assistant',
                            timestamp=msg_date + timedelta(minutes=random.randint(1, 3), seconds=random.randint(0, 50))
                        )
                        session.add(assistant_message)
                        session.flush()
                        
                        # Create answer for assistant message
                        answer = Answer(
                            message_id=assistant_message.id,
                            question_id=question.id,
                            accuracy_score=random.randint(0, 100),
                            feedback=f"Mock feedback for answer {pair_idx + 1}",
                            created_at=assistant_message.timestamp
                        )
                        session.add(answer)
                        total_answers += 1

                        # Advance current_ts for next pair within the day
                        current_ts = assistant_message.timestamp + timedelta(
                            minutes=random.randint(2, 6),
                            seconds=random.randint(0, 50)
                        )

                    # Update last_accessed to last message time
                    conversation.last_accessed = current_ts
                    
                    # Verify conversation has messages and non-zero duration before committing
                    message_count = session.query(func.count(Message.id)).filter(
                        Message.conversation_id == conversation.id
                    ).scalar()
                    
                    # Get first and last message timestamps to calculate duration
                    messages_times = session.query(
                        func.min(Message.timestamp), 
                        func.max(Message.timestamp)
                    ).filter(Message.conversation_id == conversation.id).first()
                    
                    duration_seconds = 0
                    if messages_times and messages_times[0] and messages_times[1]:
                        duration_seconds = (messages_times[1] - messages_times[0]).total_seconds()
                    
                    if message_count == 0:
                        print(f"   ❌ ERROR: Conversation {conversation.id} has 0 messages! Rolling back...")
                        session.rollback()
                        continue
                    elif duration_seconds == 0:
                        print(f"   ⚠️ WARNING: Conversation {conversation.id} has 0 duration (all messages at same timestamp)!")
                        print(f"      First msg: {messages_times[0]}, Last msg: {messages_times[1]}")
                    else:
                        print(f"   ✓ Conversation {conversation.id} validated: {message_count} messages, {duration_seconds/60:.2f} min duration")
                
                session.commit()
                print(f"✅ Created conversation for {user.name} on day {day_offset + 1}")
        
        print("\n🎉 Mock data population complete!")
        print(f"📊 Summary:")
        print(f"   - Users created: {len(test_users)}")
        print(f"   - Days of data: {num_days}")
        print(f"   - Total conversations: {len(test_users) * num_days}")
        print(f"   - Total questions: {total_questions}")
        print(f"   - Total answers: {total_answers}")
        print(f"   - Question-subtopic mappings: {total_subtopic_mappings}")
        print(f"   - Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()


if __name__ == '__main__':
    seed_mock_data()
