from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from models_simple import Base, Chatbot, User, Conversation, Message, Question, Answer, Topic, TopicDependency
from dotenv import load_dotenv
import os
from summary_generation import generate_summary_data
from grading_calculation import point_to_grade
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

@app.route("/api/topic-dependencies", methods=["POST"])
def topic_dependences_query():
    try:
        data = request.get_json()
        topic_id = data.get('topic_id')
        
        if not topic_id:
            return jsonify({'error': 'topic_id is required'}), 400
            
        session = SessionLocal()
        dependencies = session.query(TopicDependency).filter(
            (TopicDependency.topic_id == topic_id) | 
            (TopicDependency.related_topic_id == topic_id)
        ).all()
        
        result = []
        for dependency in dependencies:
            result.append({
                'topic_id': dependency.topic_id,
                'related_topic_id': dependency.related_topic_id,
                'relation_type': dependency.relation_type
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
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
        conversations = session.query(Conversation).all()
        conv_data = [conv.to_dict() for conv in conversations]
        return jsonify(conv_data)
    except Exception as e:
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
        questions = session.query(Question).all()
        questions_data = []
        for q in questions:
            questions_data.append({
                'question_id': q.question_id,
                'message_id': q.message_id,
                'topic_id': q.topic_id,
                'grade': q.grade,
                'feedback': q.feedback,
                'solo_taxonomy_label': q.solo_taxonomy_label,
                'duration': q.duration
            })
        return jsonify(questions_data)
    except Exception as e:
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