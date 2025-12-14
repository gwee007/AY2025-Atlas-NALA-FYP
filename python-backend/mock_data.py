import os
from datetime import datetime, timedelta
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from initialize_database import initialize
import numpy as np

from models_simple import (
    Base, Chatbot, User, Conversation, Message, Question, Answer,
    Topic, TopicDependency, Subtopic, DocumentChunk
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

SUBTOPICS_DATA = [
    # Topic 1: Introduction to Process Control
    {"topic_id": 1, "name": "Process Control Objectives", "summary": "Safety, stability, and optimization in process control"},
    {"topic_id": 1, "name": "Control System Components", "summary": "Sensors, controllers, actuators, and final control elements"},
    {"topic_id": 1, "name": "Process Variables and Signals", "summary": "Measurement and manipulation of process variables"},
    {"topic_id": 1, "name": "Control System Classification", "summary": "Feedback, feedforward, and cascade control strategies"},
    {"topic_id": 1, "name": "Performance Criteria", "summary": "IAE, ISE, ITAE metrics and controller evaluation"},
    
    # Topic 2: Theoretical Models of Chemical Processes
    {"topic_id": 2, "name": "Material Balance Equations", "summary": "Conservation of mass in chemical processes"},
    {"topic_id": 2, "name": "Energy Balance Equations", "summary": "Conservation of energy and heat transfer"},
    {"topic_id": 2, "name": "Momentum Balance", "summary": "Fluid flow and pressure dynamics"},
    {"topic_id": 2, "name": "Linearization Techniques", "summary": "Taylor series expansion for nonlinear models"},
    {"topic_id": 2, "name": "State-Space Representation", "summary": "Matrix form of process models"},
    
    # Topic 3: Laplace Transforms
    {"topic_id": 3, "name": "Laplace Transform Properties", "summary": "Linearity, time shifting, and transform pairs"},
    {"topic_id": 3, "name": "Inverse Laplace Transforms", "summary": "Partial fraction expansion and transform inversion"},
    {"topic_id": 3, "name": "Transform of Derivatives", "summary": "Converting differential equations to algebraic form"},
    {"topic_id": 3, "name": "Initial and Final Value Theorems", "summary": "Predicting system behavior without inverse transforms"},
    {"topic_id": 3, "name": "Convolution Theorem", "summary": "Product of transforms and system responses"},
    
    # Topic 4: Transfer Function Models
    {"topic_id": 4, "name": "Transfer Function Derivation", "summary": "Deriving transfer functions from process models"},
    {"topic_id": 4, "name": "Block Diagram Algebra", "summary": "Series, parallel, and feedback configurations"},
    {"topic_id": 4, "name": "Poles and Zeros", "summary": "Transfer function characteristics and stability indicators"},
    {"topic_id": 4, "name": "Frequency Response", "summary": "Bode plots and frequency domain analysis"},
    {"topic_id": 4, "name": "Process Gain and Time Constants", "summary": "Physical interpretation of transfer function parameters"},
    
    # Topic 5: Dynamic Behaviour of First-Order and Second-Order Processes
    {"topic_id": 5, "name": "First-Order System Response", "summary": "Time constant, settling time, and step response"},
    {"topic_id": 5, "name": "Second-Order System Response", "summary": "Damping ratio, natural frequency, and overshoot"},
    {"topic_id": 5, "name": "Underdamped Systems", "summary": "Oscillatory response and decay characteristics"},
    {"topic_id": 5, "name": "Critically and Overdamped Systems", "summary": "Non-oscillatory response behavior"},
    {"topic_id": 5, "name": "Rise Time and Peak Time", "summary": "Transient response performance metrics"},
    
    # Topic 6: Dynamic Response Characteristics of More Complicated Processes
    {"topic_id": 6, "name": "Time Delays in Processes", "summary": "Dead time effects and Padé approximation"},
    {"topic_id": 6, "name": "Inverse Response Systems", "summary": "Right-half plane zeros and non-minimum phase behavior"},
    {"topic_id": 6, "name": "Higher-Order Systems", "summary": "Multiple time constants and dominant poles"},
    {"topic_id": 6, "name": "Interacting vs Non-Interacting Systems", "summary": "Cascade tank systems and process interactions"},
    {"topic_id": 6, "name": "Multivariable Processes", "summary": "MIMO systems and coupling effects"},
    
    # Topic 7: Feedback Controllers
    {"topic_id": 7, "name": "Proportional Control", "summary": "P-only control and offset"},
    {"topic_id": 7, "name": "Integral and Derivative Actions", "summary": "Eliminating offset and anticipating changes"},
    {"topic_id": 7, "name": "PID Controller Structures", "summary": "Ideal, series, and parallel forms"},
    {"topic_id": 7, "name": "Controller Modes", "summary": "Manual, automatic, and cascade modes"},
    {"topic_id": 7, "name": "Anti-Windup Mechanisms", "summary": "Preventing integral windup in saturated systems"},
    
    # Topic 8: Dynamic Behaviour of Closed-Loop Control Systems
    {"topic_id": 8, "name": "Servo Response", "summary": "Set-point tracking performance"},
    {"topic_id": 8, "name": "Regulatory Response", "summary": "Disturbance rejection and load changes"},
    {"topic_id": 8, "name": "Closed-Loop Transfer Functions", "summary": "Complementary sensitivity and disturbance sensitivity"},
    {"topic_id": 8, "name": "Offset Analysis", "summary": "Steady-state error in proportional control"},
    {"topic_id": 8, "name": "Characteristic Equation", "summary": "Poles of closed-loop system and dynamics"},
    
    # Topic 9: Stability of Closed-Loop Control Systems
    {"topic_id": 9, "name": "Routh-Hurwitz Criterion", "summary": "Algebraic stability test for characteristic equations"},
    {"topic_id": 9, "name": "Root Locus Analysis", "summary": "Graphical method for stability assessment"},
    {"topic_id": 9, "name": "Gain and Phase Margins", "summary": "Frequency domain stability measures"},
    {"topic_id": 9, "name": "Nyquist Stability Criterion", "summary": "Encirclements and stability from frequency response"},
    {"topic_id": 9, "name": "Ultimate Gain and Period", "summary": "Sustained oscillations and stability boundaries"},
    
    # Topic 10: PID Controller Design and Tuning
    {"topic_id": 10, "name": "Ziegler-Nichols Tuning", "summary": "Empirical tuning rules for PID controllers"},
    {"topic_id": 10, "name": "Cohen-Coon Method", "summary": "Model-based tuning approach"},
    {"topic_id": 10, "name": "Internal Model Control (IMC)", "summary": "Model-based controller design and tuning"},
    {"topic_id": 10, "name": "Lambda Tuning", "summary": "Closed-loop time constant specification"},
    {"topic_id": 10, "name": "Auto-Tuning Methods", "summary": "Relay feedback and adaptive tuning techniques"},
]

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
        for subtopic_data in SUBTOPICS_DATA:
            subtopic = Subtopic(
                topic_id=subtopic_data["topic_id"],
                subtopic_name=subtopic_data["name"],
                subtopic_summary=subtopic_data["summary"]
                # subtopic_summary_embedding=generate_embedding()  # Disabled
            )
            subtopics.append(subtopic)
            session.add(subtopic)
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
