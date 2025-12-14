import os
import json 
from datetime import datetime, timedelta
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from initialize_database import initialize
import numpy as np

from models_simple import (
    Base, Chatbot, User, Conversation, Message, Question, Answer,
    Topic, TopicDependency, Subtopic, DocumentChunk, SubtopicDependency
)

load_dotenv()

engine = initialize()
SessionLocal = sessionmaker(bind=engine)

# Topic data - Chemical Engineering Process Control
TOPICS_DATA = [
    {"id": 1, "name": "Introduction to Process Control", "summary": "Fundamental concepts of process control, control objectives, and basic terminology"},
    {"id": 2, "name": "Theoretical Models of Chemical Processes", "summary": "Mathematical modeling of chemical processes, conservation principles, and process equations"},
    {"id": 3, "name": "Laplace Transforms", "summary": "Laplace transform theory, applications to process control, and solving differential equations"},
    {"id": 4, "name": "Transfer Function Models", "summary": "Transfer functions, block diagrams, and frequency domain analysis"},
    {"id": 5, "name": "Dynamic Behaviour of First-Order and Second-Order Processes", "summary": "Time-domain response characteristics, step response, and process dynamics"},
    {"id": 6, "name": "Dynamic Response Characteristics of More Complicated Processes", "summary": "Higher-order systems, time delays, and complex process behavior"},
    {"id": 7, "name": "Feedback Controllers", "summary": "Controller types, feedback control principles, and controller actions"},
    {"id": 8, "name": "Dynamic Behaviour of Closed-Loop Control Systems", "summary": "Closed-loop dynamics, servo and regulatory responses, and system performance"},
    {"id": 9, "name": "Stability of Closed-Loop Control Systems", "summary": "Stability criteria, Routh-Hurwitz criterion, and stability analysis methods"},
    {"id": 10, "name": "PID Controller Design and Tuning", "summary": "PID controller principles, tuning methods, and performance optimization"}
]

TOPIC_DEPENDENCIES = [
    {"topic_id": 4, "related_topic_id": 2, "relation_type": "prerequisite"},
    {"topic_id": 4, "related_topic_id": 3, "relation_type": "prerequisite"},
    {"topic_id": 5, "related_topic_id": 4, "relation_type": "prerequisite"},
    {"topic_id": 6, "related_topic_id": 4, "relation_type": "prerequisite"},
    {"topic_id": 6, "related_topic_id": 5, "relation_type": "prerequisite"},
    {"topic_id": 8, "related_topic_id": 1, "relation_type": "prerequisite"},
    {"topic_id": 8, "related_topic_id": 5, "relation_type": "prerequisite"},
    {"topic_id": 8, "related_topic_id": 6, "relation_type": "prerequisite"},
    {"topic_id": 8, "related_topic_id": 7, "relation_type": "prerequisite"},
    {"topic_id": 9, "related_topic_id": 1, "relation_type": "prerequisite"},
    {"topic_id": 9, "related_topic_id": 5, "relation_type": "prerequisite"},
    {"topic_id": 9, "related_topic_id": 6, "relation_type": "prerequisite"},
    {"topic_id": 9, "related_topic_id": 7, "relation_type": "prerequisite"},
    {"topic_id": 10, "related_topic_id": 7, "relation_type": "prerequisite"}
]

# loading from subtopic data in the file folder in ./mock_data/subtopic summary
# goal: for each json, for example
# {
#         "topic_id": 1,
#         "subtopic_name": "Blending System Illustration",
#         "subtopic_summary": "Block Diagram Representation talks about using block diagrams to visually represent the components and interactions within a control system. It explains how to illustrate the flow of signals between the process, sensor, controller, and final control element, providing a clear overview of the control system's structure and function."
#     },
# we want to load them into the Subtopic table
folder_path = './mock_data/subtopic summary'
SUBTOPICS_DATA = []
for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            filepath = os.path.join(folder_path, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)
                for subtopic in data:
                    SUBTOPICS_DATA.append(subtopic) 


def generate_embedding(dimension=1024):
    """Generate a random embedding vector (currently disabled)"""
    return None  # Temporarily disabled - requires pgvector extension
    # return np.random.rand(dimension).tolist()

def populate_mock_data():
    """Populate all tables with mock data"""
    session = SessionLocal()
    
    try:
        # Drop and recreate all tables
        print("Dropping and recreating tables...")
        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)
        print("Tables created successfully.")
        
        # 1. Create Topics
        print("\nCreating topics...")
        topics = []
        for topic_data in TOPICS_DATA:
            topic = Topic(
                id=topic_data["id"],
                topic_name=topic_data["name"],
                topic_summary=topic_data["summary"]
                # topic_summary_embedding=generate_embedding()  # Disabled
            )
            topics.append(topic)
            session.add(topic)
        session.flush()
        print(f"Created {len(topics)} topics")
        
        # 2. Create Topic Dependencies
        print("\nCreating topic dependencies...")
        for dep_data in TOPIC_DEPENDENCIES:
            dependency = TopicDependency(
                topic_id=dep_data["topic_id"],
                related_topic_id=dep_data["related_topic_id"],
                relation_type=dep_data["relation_type"]
            )
            session.add(dependency)
        session.flush()
        print(f"Created {len(TOPIC_DEPENDENCIES)} topic dependencies")
        
        # 3. Create Subtopics
        print("\nCreating subtopics...")
        subtopics = []
        number_of_subtopic_dependencies  = 0
        prev_topic = None
        for subtopic_data in SUBTOPICS_DATA:
            current_topic = subtopic_data["topic_id"]
            subtopic = Subtopic(
            topic_id=subtopic_data["topic_id"],
            subtopic_name=subtopic_data["subtopic_name"],
            subtopic_summary=subtopic_data["subtopic_summary"]
            # subtopic_summary_embedding=generate_embedding()  # Disabled
            )
            subtopics.append(subtopic)
            session.add(subtopic)
            
            # Create prerequisite dependency between consecutive subtopics of the same topic
            if prev_topic == current_topic and len(subtopics) > 1:
                number_of_subtopic_dependencies += 1 
                subtopic_dependency = SubtopicDependency(
                    subtopic_id=subtopic_data["topic_id"],
                    related_subtopic_id=subtopics[-2].topic_id,
                    relation_type="prerequisite"
                )
                session.add(subtopic_dependency)
            
            prev_topic = current_topic

        session.flush()
        print(f"Created {len(subtopics)} subtopics")
        
        # 4. Create Document Chunks
        print("\nCreating document chunks...")
        document_contents = [
            "This comprehensive guide covers the theoretical foundations and practical applications.",
            "Step-by-step derivations and worked examples demonstrate key concepts.",
            "Real-world industrial process control examples illustrate the principles.",
            "Advanced techniques and best practices from process industries.",
            "Common challenges, troubleshooting approaches, and implementation guidelines."
        ]
        
        for subtopic in subtopics:
            for i, content in enumerate(document_contents):
                chunk = DocumentChunk(
                    subtopic_id=subtopic.id,
                    content=f"{content} (Part {i+1} for {subtopic.subtopic_name})"
                    # embedding=generate_embedding()  # Disabled
                )
                session.add(chunk)
        session.flush()
        print(f"Created {len(subtopics) * len(document_contents)} document chunks")
        
        # 5. Create Chatbot
        print("\nCreating chatbot...")
        chatbot = Chatbot(
            chatbot_id=1,
            users_count=13  # Updated to 13 users
        )
        session.add(chatbot)
        session.flush()
        print("Created chatbot")
        
        # 6. Create Users
        print("\nCreating users...")
        users = []
        for i in range(1, 14):  # Create 13 users total
            user = User(
                user_id=100 + i,
                chatbot_id=chatbot.chatbot_id,
                conversations_count=random.randint(2, 6)  # Slightly more conversations
            )
            users.append(user)
            session.add(user)
        session.flush()
        print(f"Created {len(users)} users")
        
        # 7. Create Conversations, Messages, Questions, and Answers
        print("\nCreating conversations with messages, questions, and answers...")
        conversation_titles = [
            "Understanding Transfer Functions",
            "Help with Laplace Transforms",
            "PID Tuning Question",
            "Stability Analysis",
            "First-Order System Dynamics",
            "Feedback Control Concepts",
            "Time Delay Effects",
            "Closed-Loop Behavior",
            "Material Balance Problems",
            "Energy Balance Applications",
            "Frequency Response Analysis",
            "Root Locus Method",
            "Nyquist Criterion Discussion",
            "Cohen-Coon Tuning",
            "IMC Controller Design",
            "State-Space Modeling",
            "Block Diagram Simplification",
            "Second-Order Response",
            "Inverse Response Systems",
            "Multivariable Control",
            "Anti-Windup Techniques",
            "Process Gain Calculation",
            "Time Constant Estimation",
            "Disturbance Rejection"
        ]
        
        grades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"]
        solo_labels = ["Prestructural", "Unistructural", "Multistructural", "Relational", "Extended Abstract"]
        
        conversation_count = 0
        message_count = 0
        question_count = 0
        answer_count = 0
        
        for user in users:
            num_conversations = user.conversations_count
            for conv_idx in range(num_conversations):
                # Spread conversations over last 90 days with clustering patterns
                days_ago = random.randint(1, 90)
                created_time = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
                updated_time = created_time + timedelta(minutes=random.randint(15, 180))  # 15 min to 3 hours
                
                conversation = Conversation(
                    user_id=user.user_id,
                    title=random.choice(conversation_titles),
                    created_at=created_time,
                    updated_at=updated_time
                )
                session.add(conversation)
                session.flush()
                conversation_count += 1
                
                # Create 3-8 message pairs (question + answer) - more variety
                num_messages = random.randint(3, 8) * 2  # Pairs of user/bot messages
                for msg_idx in range(num_messages):
                    is_user_message = (msg_idx % 2 == 0)
                    
                    message = Message(
                        conversation_id=conversation.id,
                        sender="user" if is_user_message else "bot",
                        content=f"This is {'a question' if is_user_message else 'an answer'} about {conversation.title}",
                        timestamp=created_time + timedelta(minutes=msg_idx * random.randint(2, 8)),
                        message_metadata={"length": random.randint(30, 350)}
                    )
                    session.add(message)
                    session.flush()
                    message_count += 1
                    
                    # Create Question for user messages
                    if is_user_message:
                        selected_topic = random.choice(topics)
                        
                        # Weight grades - more realistic distribution
                        grade_weights = [0.05, 0.08, 0.12, 0.15, 0.18, 0.15, 0.12, 0.08, 0.04, 0.02, 0.01, 0.005]
                        selected_grade = random.choices(grades, weights=grade_weights)[0]
                        
                        # Weight SOLO labels - higher levels less common
                        solo_weights = [0.05, 0.25, 0.35, 0.25, 0.10]
                        selected_solo = random.choices(solo_labels, weights=solo_weights)[0]
                        
                        question = Question(
                            message_id=message.message_id,
                            topic_id=selected_topic.id,
                            grade=selected_grade,
                            feedback=f"Good question about {selected_topic.topic_name}!",
                            solo_taxonomy_label=selected_solo,
                            duration=random.randint(20, 450)  # 20 seconds to 7.5 minutes
                        )
                        session.add(question)
                        session.flush()
                        question_count += 1
                        
                        # Create Answer for bot response (next message)
                        if msg_idx + 1 < num_messages:
                            # Accuracy correlates somewhat with question grade
                            if selected_grade in ["A+", "A", "A-"]:
                                accuracy = random.randint(85, 100)
                            elif selected_grade in ["B+", "B", "B-"]:
                                accuracy = random.randint(75, 92)
                            elif selected_grade in ["C+", "C", "C-"]:
                                accuracy = random.randint(65, 85)
                            else:
                                accuracy = random.randint(50, 75)
                            
                            answer = Answer(
                                question_id=question.question_id,
                                message_id=message.message_id,  # Will be updated to bot message
                                topic_id=selected_topic.id,
                                accuracy=accuracy,
                                feedback=f"Comprehensive answer covering {selected_topic.topic_name}"
                            )
                            session.add(answer)
                            session.flush()
                            answer_count += 1
        
        print(f"Created {conversation_count} conversations")
        print(f"Created {message_count} messages")
        print(f"Created {question_count} questions")
        print(f"Created {answer_count} answers")
        
        # Commit all changes
        session.commit()
        print("\n✅ All mock data successfully created and committed!")
        
        # Print summary
        print("\n" + "="*50)
        print("MOCK DATA SUMMARY")
        print("="*50)
        print(f"Topics: {len(topics)}")
        print(f"Topic Dependencies: {len(TOPIC_DEPENDENCIES)}")
        print(f"Subtopic Dependencies: {number_of_subtopic_dependencies }")
        print(f"Subtopics: {len(subtopics)}")
        print(f"Document Chunks: {len(subtopics) * len(document_contents)}")
        
        print(f"Chatbots: 1")
        print(f"Users: {len(users)}")
        print(f"Conversations: {conversation_count}")
        print(f"Messages: {message_count}")
        print(f"Questions: {question_count}")
        print(f"Answers: {answer_count}")
        print("="*50)
        
    except Exception as e:
        session.rollback()
        print(f"\nError creating mock data: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    print("Starting mock data population...")
    populate_mock_data()
    print("\nDone!")
