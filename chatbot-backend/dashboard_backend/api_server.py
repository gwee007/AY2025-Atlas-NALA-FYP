from flask import Blueprint, jsonify, request
from sqlalchemy import func, case, desc
# UPDATED: Import from app.database.models.py instead of models_simple
from app.database.models import Base, User, Conversation, Message, Question, Answer, Topic, TopicDependency, Subtopic, question_topics
from app.database.session import get_db_session
from dotenv import load_dotenv
import os
import traceback

# UPDATED: Import your refactored summary logic
from .summary_generation import generate_summary_data
from .grading_calculation import point_to_grade
from .averageCalculation import individual_statistics, group_statistics
from .redis_client import get_redis_client, invalidate_user_cache, invalidate_group_cache, invalidate_all_caches
red_client = get_redis_client()
load_dotenv()

# Create Blueprint instead of Flask app
dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "API is running"}), 200

@dashboard_bp.route("/api/test-db", methods=["GET"])
def test_db():
    try:
        session = get_db_session()
        user_count = session.query(User).count()
        session.close()
        return jsonify({"status": "Database OK", "user_count": user_count}), 200
    except Exception as e:
        return jsonify({"error": str(e), "type": str(type(e).__name__)}), 500

@dashboard_bp.route("/api/cache/invalidate/<int:user_id>", methods=["POST"])
def invalidate_cache(user_id):
    """Invalidate cache for a specific user and optionally group cache."""
    try:
        # Check if we should also invalidate group cache
        invalidate_group = request.args.get('group', 'false').lower() == 'true'
        
        if invalidate_group:
            deleted_count = invalidate_all_caches(user_id)
            return jsonify({
                "status": "success",
                "user_id": user_id,
                "keys_deleted": deleted_count,
                "message": f"User and group cache invalidated for user {user_id}"
            }), 200
        else:
            deleted_count = invalidate_user_cache(user_id)
            return jsonify({
                "status": "success",
                "user_id": user_id,
                "keys_deleted": deleted_count,
                "message": f"Cache invalidated for user {user_id}"
            }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

@dashboard_bp.route("/api/individual-statistics", methods=["POST"])
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
        print(f"[ERROR] individual_statistics failed: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route("/api/group-statistics", methods=["GET"])
def group_statistics_end():
    try:
        stats = group_statistics()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/api/topic-dependencies', methods=['GET'])
def get_topic_dependencies():
    session = get_db_session()
    
    # CRITICAL: We need the user_id to know WHICH grades to fetch.
    # We grab it from the query parameters (e.g., ?user_id=101)
    user_id = request.args.get('user_id')
    
    try:
        grade_lookup = {}
        
        if user_id:
            try:
                # Fetch the full stats object
                user_stats = individual_statistics(int(user_id))
                
                # ✅ FIX: Use node_data directly (contains BOTH topics AND subtopics)
                # grades_by_topic only has topics, so subtopics would be missing!
                grades_list = user_stats.get('node_data', [])
                
                # 🔍 Diagnostic: Log the grades_list structure
                print(f"[DEBUG] grades_list for user {user_id} (first 3): {grades_list[:3]}")  # Show first 3
                print(f"[DEBUG] Total nodes with grades: {len(grades_list)}")
                
                # Build a fast lookup map: "type_id" -> "Grade Letter"
                # Example: "topic_1" -> "A"
                for item in grades_list:
                    key = f"{item['type']}_{item['topic_id']}"
                    grade_lookup[key] = item.get('avg_grade_letter', 'N/A')
                    
                print(f"[DEBUG] grade_lookup built: {list(grade_lookup.items())[:5]}")  # Show first 5
                    
            except Exception as e:
                print(f"[WARN] Could not fetch stats for user {user_id}: {e}")

        # ---------------------------------------------------------
        # 2. BUILD NODES (Now with Grades!)
        # ---------------------------------------------------------
        topics = session.query(Topic).all()
        subtopics = session.query(Subtopic).all()
        topic_dependencies = session.query(TopicDependency).all()
        
        nodes = []
        
        # Process Main Topics
        for topic in topics:
            node_id = f"topic_{topic.id}"
            nodes.append({
                "id": node_id,
                "label": topic.topic_name,
                "type": "topic",
                "radius": 40,
                # INJECT GRADE HERE
                "grade": grade_lookup.get(node_id, "N/A") 
            })
        
        # Process Subtopics
        for subtopic in subtopics:
            node_id = f"subtopic_{subtopic.id}"
            nodes.append({
                "id": node_id,
                "label": subtopic.subtopic_name,
                "type": "subtopic",
                "radius": 25,
                "parent_topic_id": subtopic.topic_id,
                # INJECT GRADE HERE
                "grade": grade_lookup.get(node_id, "N/A")
            })
        
        # ---------------------------------------------------------
        # 3. BUILD LINKS (Standard)
        # ---------------------------------------------------------
        links = []
        for dep in topic_dependencies:
            links.append({
                "source": f"topic_{dep.topic_id}",
                "target": f"topic_{dep.related_topic_id}",
                "relation_type": dep.relation_type
            })
        
        for subtopic in subtopics:
            links.append({
                "source": f"subtopic_{subtopic.id}",
                "target": f"topic_{subtopic.topic_id}",
                "relation_type": "subtopic_of"
            })
        
        return jsonify({"nodes": nodes, "links": links})
    
    except Exception as e:
        print(f"[ERROR] get_topic_dependencies failed: {str(e)}")
        # Import traceback inside the function if not global, or ensure it's imported at top
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@dashboard_bp.route("/api/dashboard-stats", methods=["GET"])
def get_dashboard_stats():
    print("Fetching dashboard stats...")
    CASH_KEY = "dashboard_stats"
    cached_stats = red_client.get(CASH_KEY)
    if cached_stats:
        print("Returning cached dashboard stats.")
        return jsonify(eval(cached_stats))
    print("No cached stats found, querying database...")
    session = get_db_session()
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
        red_client.setex(CASH_KEY, 300, str(stats))  # Cache for 5 minutes
        return jsonify(stats)
    except Exception as e:
        print("Error fetching dashboard stats:", e)
        return jsonify({"error": "Failed to fetch dashboard stats"}), 500
    finally:
        session.close()

@dashboard_bp.route('/api/users', methods=['GET'])
def get_users():
    session = get_db_session()
    try:
        users = session.query(User).all()
        # Ensure your User model has a to_dict method, or construct manually
        users_data = []
        for user in users:
            users_data.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "created_at": user.created_at.isoformat() if user.created_at else None
            })
        return jsonify(users_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@dashboard_bp.route('/api/conversations', methods=['GET'])
def get_conversations():
    session = get_db_session()
    try:
        topic_id = request.args.get('topic_id', type=int)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        # 1. Define Grade to Numeric logic
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
        
        # 2. Build Query
        # Join Strategy: Conversation -> Message -> Question
        query = session.query(
            Conversation,
            func.avg(grade_to_numeric).label('mean_grade')
        ).outerjoin(Message, Conversation.id == Message.conversation_id)\
         .outerjoin(Question, Message.id == Question.message_id) # UPDATED: Message.id
        
        # 3. Apply Topic Filter (Many-to-Many logic)
        if topic_id:
            # We need to join Question -> question_topics -> Topic
            query = query.join(question_topics, Question.id == question_topics.c.question_id)\
                         .filter(question_topics.c.topic_id == topic_id)

        # Group by Conversation
        query = query.group_by(Conversation.id)
        
        # Add Pagination
        total = query.count()
        conversations = query.limit(per_page).offset((page - 1) * per_page).all()
        
        # 4. Format Output
        conv_data = []
        for conv, mean_grade in conversations:
            conv_dict = {
                "id": conv.id,
                "user_id": conv.user_id,
                "title": conv.title,
                # New schema has last_accessed, not created_at
                "last_accessed": conv.last_accessed.isoformat() if conv.last_accessed else None
            }
            
            if mean_grade is not None:
                conv_dict['mean_grade_points'] = round(float(mean_grade), 2)
                conv_dict['mean_grade'] = point_to_grade(float(mean_grade))
            else:
                conv_dict['mean_grade_points'] = None
                conv_dict['mean_grade'] = None
            
            conv_data.append(conv_dict)
            
        return jsonify({
            'data': conv_data,
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': (total + per_page - 1) // per_page
        })
        
    except Exception as e:
        print(f"[ERROR] get_conversations failed: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@dashboard_bp.route('/api/topics', methods=['GET'])
def get_topics():
    session = get_db_session()
    try:
        topics = session.query(Topic).all()
        topics_data = [{"id": t.id, "topic_name": t.topic_name, "summary": t.topic_summary} for t in topics]
        return jsonify(topics_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@dashboard_bp.route('/api/questions', methods=['GET'])
def get_questions():
    session = get_db_session()
    try:
        topic_id = request.args.get('topic_id', type=int) 
         
        user_id = request.args.get('user_id', type=int)
        # pagination parameters 

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 5, type=int)
        offset= (page - 1) * per_page

        # Join Question -> Message
        query = session.query(Question, Message).join(
            Message, Question.message_id == Message.id # UPDATED: Message.id
        )
        
        # Filter by topic_id if provided (Many-to-Many)
        if user_id:
            query = query.join(Conversation, Message.conversation_id == Conversation.id)\
                         .filter(Conversation.user_id == user_id)
        if topic_id:
            query = query.join(question_topics, Question.id == question_topics.c.question_id)\
                         .filter(question_topics.c.topic_id == topic_id)
        total_items = query.count() # total items for pagination
        query = query.order_by(Question.created_at.desc())\
                     .limit(per_page).offset(offset) # pagination
        questions = query.all()
        questions_data = []
        
        for q, msg in questions:
            questions_data.append({
                'question_id': q.id, # UPDATED: q.id
                'content': msg.content,
                'grade': q.grade,
                'timestamp': msg.timestamp.isoformat() if msg.timestamp else None,
                'conversation_id': msg.conversation_id  # Add conversation_id for linking
            })

        return jsonify({
            'data': questions_data,
            'pagination': {
                'total': total_items,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_items + per_page - 1) // per_page
            }
        })
    except Exception as e:
        print(f"[ERROR] get_questions failed: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@dashboard_bp.route('/api/recent-activities', methods=['GET'])
def get_recent_activities():
    session = get_db_session()
    try:
        # Use last_accessed for sorting since created_at is gone
        recent_convs = session.query(Conversation).order_by(Conversation.last_accessed.desc()).limit(5).all()
        activities = []
        for conv in recent_convs:
            activities.append({
                'time': conv.last_accessed.isoformat() if conv.last_accessed else 'Unknown',
                'activity': f"Accessed conversation: {conv.title or 'Untitled'}"
            })
        return jsonify(activities)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@dashboard_bp.route('/api/generate-summary', methods=['POST'])
def generate_summary_endpoint():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        print(f"[DEBUG] Generating summary for user_id: {user_id}")
        
        # UPDATED: Use the LLM function you just debugged
        # It handles the API call internally and has a robust try/except
        summary_response = generate_summary_data(user_id)
        
        if summary_response:
             # Assuming LLM returns {"summary": "markdown string..."} or similar
             # If your LLM function returns the raw JSON from API, pass it through
             return jsonify(summary_response)
        else:
             # Fallback if LLM fails (you can import generate_summary_data if you want a pure backup)
             return jsonify({'error': 'Failed to generate summary'}), 500

    except Exception as e:
        print(f"[ERROR] generate_summary failed: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500