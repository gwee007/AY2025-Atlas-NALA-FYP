from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, func, case
from models_simple import Base, Chatbot, User, Conversation, Message, Question, Answer, Topic, TopicDependency, Subtopic
from dotenv import load_dotenv
import os
from summary_generation import generate_summary_data
from grading_calculation import point_to_grade, grade_to_point
from averageCalculation import individual_statistics, group_statistics
import requests
from initialize_database import get_engine

load_dotenv()
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend (running on different port)

# Database connection
engine = get_engine()
SessionLocal = sessionmaker(bind=engine)

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "API is running"}), 200

@app.route("/api/test-db", methods=["GET"])
def test_db():
    try:
        session = SessionLocal()
        user_count = session.query(User).count()
        session.close()
        return jsonify({"status": "Database OK", "user_count": user_count}), 200
    except Exception as e:
        return jsonify({"error": str(e), "type": str(type(e).__name__)}), 500

@app.route("/api/individual-statistics", methods=["POST"])
def individual_statistics_end():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
 
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        print(f"[DEBUG] Fetching individual stats for user_id: {user_id}")
        stats = individual_statistics(user_id)
        return jsonify(stats)
    except Exception as e:
        import traceback
        print(f"[ERROR] individual_statistics failed: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route("/api/group-statistics", methods=["GET"])
def group_statistics_end():
    try:
        # Call group statistics logic
        stats = group_statistics()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

#  I realize we might just need to just pull the whole damn tree every load 
@app.route('/api/topic-dependencies', methods=['GET'])
def get_topic_dependencies():
    session = SessionLocal()
    try:
        # Fetch all topics and subtopics
        topics = session.query(Topic).all()
        subtopics = session.query(Subtopic).all()
        topic_dependencies = session.query(TopicDependency).all()
        
        
        # Build nodes for topics
        nodes = []
        for topic in topics:
            nodes.append({
                "id": f"topic_{topic.id}",
                "label": topic.topic_name,
                "type": "topic",
                "radius": 40
            })
        
        # Build nodes for subtopics
        for subtopic in subtopics:
            nodes.append({
                "id": f"subtopic_{subtopic.id}",
                "label": subtopic.subtopic_name,
                "type": "subtopic",
                "radius": 25,
                "parent_topic_id": subtopic.topic_id
            })
        
        # Build links for topic dependencies (topic to topic)
        links = []
        for dep in topic_dependencies:
            links.append({
                "source": f"topic_{dep.topic_id}",
                "target": f"topic_{dep.related_topic_id}",
                "relation_type": dep.relation_type
            })
        

        
        # Add links from subtopics to their parent topics
        for subtopic in subtopics:
            links.append({
                "source": f"subtopic_{subtopic.id}",
                "target": f"topic_{subtopic.topic_id}",
                "relation_type": "subtopic_of"
            })
        
        return jsonify({"nodes": nodes, "links": links})
    
    except Exception as e:
        import traceback
        print(f"[ERROR] get_topic_dependencies failed: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@app.route("/api/dashboard-stats", methods=["GET"])
def get_dashboard_stats():
    print("Fetching dashboard stats...")
    session = SessionLocal()
    try:
        user_count = session.query(User).count()
        conversation_count = session.query(Conversation).count()
        message_count = session.query(Message).count()
        question_count = session.query(Question).count()
        answer_count = session.query(Answer).count()
        topic_count = session.query(Topic).count()

        stats = {
            "user_count": user_count,
            "conversation_count": conversation_count,
            "message_count": message_count,
            "question_count": question_count,
            "answer_count": answer_count,
            "topic_count": topic_count
        }
        print("Dashboard stats fetched successfully:", stats)
        return jsonify(stats)
    except Exception as e:
        print("Error fetching dashboard stats:", e)
        return jsonify({"error": "Failed to fetch dashboard stats"}), 500

    finally:
        session.close()


@app.route('/api/users', methods=['GET'])
def get_users():
    session = SessionLocal()
    try:
        users = session.query(User).all()
        users_data = [user.to_dict() for user in users]  # Assuming to_dict() method exists
        return jsonify(users_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    session = SessionLocal()
    try:
        topic_id = request.args.get('topic_id', type=int)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        print("[DEBUG] get_conversations called with topic_id:", topic_id, "page:", page, "per_page:", per_page)
        # Create a CASE expression to convert letter grades to numeric points
        # This mirrors your grade_to_point() logic but runs in SQL
        from sqlalchemy import case
        
        grade_to_numeric = case(
            (Question.grade == 'A+', 4.5),
            (Question.grade == 'A', 4.0),
            (Question.grade == 'A-', 3.7),
            (Question.grade == 'B+', 3.3),
            (Question.grade == 'B', 3.0),
            (Question.grade == 'B-', 2.7),
            (Question.grade == 'C+', 2.3),
            (Question.grade == 'C', 2.0),
            (Question.grade == 'C-', 1.7),
            (Question.grade == 'D+', 1.3),
            (Question.grade == 'D', 1.0),
            (Question.grade == 'F', 0.0),
            else_=None
        )
        
        # Build base query with a single aggregated subquery
        grade_subquery = session.query(
            Message.conversation_id,
            func.avg(grade_to_numeric).label('mean_grade')
        ).join(
            Question, Message.message_id == Question.message_id
        ).group_by(
            Message.conversation_id
        ).subquery()
        
        # Main query - join conversations with pre-calculated grades
        query = session.query(
            Conversation,
            grade_subquery.c.mean_grade
        ).outerjoin(
            grade_subquery,
            Conversation.id == grade_subquery.c.conversation_id
        )
        
        # Apply topic filter if provided
        if topic_id:
            query = query.join(
                Message, Conversation.id == Message.conversation_id
            ).join(
                Question, Message.message_id == Question.message_id
            ).filter(
                Question.topic_id == topic_id
            ).distinct()
        
        # Add pagination
        total = query.count()
        conversations = query.limit(per_page).offset((page - 1) * per_page).all()
        
        # Build response data
        conv_data = []
        for conv, mean_grade in conversations:
            conv_dict = conv.to_dict()
            
            if mean_grade:
                conv_dict['mean_grade_points'] = round(mean_grade, 2)
                conv_dict['mean_grade'] = point_to_grade(mean_grade)
            else:
                conv_dict['mean_grade_points'] = None
                conv_dict['mean_grade'] = None
            
            conv_dict['created_at'] = conv.created_at.isoformat() if hasattr(conv, 'created_at') else None
            conv_data.append(conv_dict)
        print(f"[DEBUG] Successfully returning {len(conv_data)} conversations")
        return jsonify({
            'data': conv_data,
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': (total + per_page - 1) // per_page
        })
        
    except Exception as e:
        import traceback
        print(f"[ERROR] get_conversations failed: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@app.route('/api/topics', methods=['GET'])
def get_topics():
    session = SessionLocal()
    try:
        topics = session.query(Topic).all()
        topics_data = [topic.to_dict() for topic in topics]
        return jsonify(topics_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@app.route('/api/questions', methods=['GET'])
def get_questions():
    session = SessionLocal()
    try:
        topic_id = request.args.get('topic_id', type=int)  

        # Join Question with Message to get timestamp and content
        query = session.query(Question, Message).join(
            Message, Question.message_id == Message.message_id
        )
        
        # Filter by topic_id if provided
        if topic_id:
            query = query.filter(Question.topic_id == topic_id)
        
        questions = query.all()
        questions_data = []
        
        for q, msg in questions:
            questions_data.append({
                'question_id': q.question_id,
                'content': msg.content,  # Question message content
                'grade': q.grade,
                'timestamp': msg.timestamp.isoformat() if msg.timestamp else None
            })

        return jsonify(questions_data)
    except Exception as e:
        import traceback
        print(f"[ERROR] get_questions failed: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@app.route('/api/recent-activities', methods=['GET'])
def get_recent_activities():
    session = SessionLocal()
    try:
        # Get recent conversations as activities
        recent_convs = session.query(Conversation).order_by(Conversation.created_at.desc()).limit(5).all()
        activities = []
        for conv in recent_convs:
            activities.append({
                'time': conv.created_at.isoformat() if conv.created_at else 'Unknown',
                'activity': f"New conversation: {conv.title or 'Untitled'}"
            })
        return jsonify(activities)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@app.route('/api/generate-summary', methods=['POST'])
def generate_summary_endpoint():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        print(f"[DEBUG] Generating summary for user_id: {user_id}")
        # Call summary generation logic - returns Markdown string
        summary = generate_summary_data(user_id)
        
        return jsonify({'summary': summary})
    except Exception as e:
        import traceback
        print(f"[ERROR] generate_summary failed: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)