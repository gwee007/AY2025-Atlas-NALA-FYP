"""
Example usage of the NALA Python backend.
Demonstrates database operations, caching, and dashboard metrics.
"""

from database import init_db, get_db_session
from models import User, Course, Chatbot, Conversation
from redis_cache import init_redis, precompute_course_stats, get_dashboard_stats
from dashboard_metrics import get_complete_dashboard


def setup_example():
    """Initialize database and create example data"""
    print("🚀 Setting up example...")
    
    # Initialize database tables
    print("Creating database tables...")
    init_db()
    
    # Initialize Redis
    print("Connecting to Redis...")
    init_redis()
    
    print("✅ Setup complete!\n")


def example_database_operations():
    """Example database CRUD operations"""
    print("📝 Example: Database Operations\n")
    
    db = get_db_session()
    try:
        # Create a user
        user = User(
            hashed_id="example_hash_001",
            username="example_user",
            email="example@university.edu",
            password="hashed_password",
            group="students"
        )
        db.add(user)
        db.commit()
        print(f"✅ Created user: {user.username} (ID: {user.user_id})")
        
        # Query users
        all_users = db.query(User).all()
        print(f"📊 Total users in database: {len(all_users)}")
        
        # Update user
        user.avatar = "https://i.pravatar.cc/150?img=1"
        db.commit()
        print(f"✅ Updated user avatar")
        
        # Delete user
        db.delete(user)
        db.commit()
        print(f"🗑️ Deleted example user\n")
        
    finally:
        db.close()


def example_redis_caching():
    """Example Redis caching operations"""
    print("💾 Example: Redis Caching\n")
    
    course_id = 1
    
    # Precompute course statistics
    print(f"⚙️  Precomputing stats for course {course_id}...")
    precompute_course_stats(course_id)
    
    # Get cached dashboard stats
    print(f"📊 Fetching dashboard stats (from cache)...")
    stats = get_dashboard_stats(course_id, user_id=1)
    
    print("\nDashboard Stats:")
    print(f"  Average Points: {stats['course']['averagePoints']}")
    print(f"  Average Quality Score: {stats['course']['averageQualityScore']}")
    print(f"  Average Interaction Time: {stats['course']['averageInteractionTime']}s")
    print(f"  Top Students: {len(stats['course']['topStudents'])} entries")
    
    if stats['user']:
        print("\nUser Comparison:")
        print(f"  Student Score: {stats['user']['studentScore']}")
        print(f"  Course Average: {stats['user']['courseAverage']}")
        print(f"  Percentile: {stats['user']['percentile']}%")
        print(f"  Above Average: {stats['user']['aboveAverage']}")
    
    print()


def example_dashboard_metrics():
    """Example dashboard metrics and analytics"""
    print("📈 Example: Dashboard Metrics\n")
    
    course_id = 1
    user_id = 1
    
    # Get complete dashboard
    dashboard = get_complete_dashboard(course_id, user_id)
    
    print("Course Overview:")
    print(f"  Total Students: {dashboard['overview']['totalStudents']}")
    print(f"  Total Conversations: {dashboard['overview']['totalConversations']}")
    print(f"  Total Messages: {dashboard['overview']['totalMessages']}")
    
    print("\nEngagement (Last 30 Days):")
    print(f"  Active Students: {dashboard['engagement']['activeStudents']}")
    print(f"  New Conversations: {dashboard['engagement']['newConversations']}")
    print(f"  Messages Sent: {dashboard['engagement']['messagesSent']}")
    
    print("\nGrading Summary:")
    grading = dashboard['gradingSummary']
    print(f"  Total Activities: {grading['totalActivities']}")
    print(f"  Average Percentage: {grading['averagePercentage']}%")
    print(f"  Correct Answer Rate: {grading['correctAnswerRate']}%")
    
    if dashboard['studentPerformance']:
        print("\nStudent Performance:")
        perf = dashboard['studentPerformance']
        print(f"  Total Questions: {perf['totalQuestions']}")
        print(f"  Grade Distribution: {perf['gradeDistribution']}")
    
    print()


def example_relationships():
    """Example of working with related models"""
    print("🔗 Example: Model Relationships\n")
    
    db = get_db_session()
    try:
        # Get a user with all related data
        user = db.query(User).first()
        if user:
            print(f"User: {user.username}")
            print(f"  Conversations: {len(user.conversations)}")
            print(f"  Chatbots Created: {len(user.chatbots)}")
            print(f"  Activity Logs: {len(user.activity_logs)}")
            
            # Get a conversation with messages
            if user.conversations:
                conv = user.conversations[0]
                print(f"\nConversation: {conv.title}")
                print(f"  Messages: {len(conv.messages)}")
                print(f"  Last Accessed: {conv.last_accessed}")
        else:
            print("No users found in database. Run database seeding first.")
        
        print()
        
    finally:
        db.close()


def main():
    """Run all examples"""
    print("=" * 60)
    print("NALA Python Backend - Example Usage")
    print("=" * 60)
    print()
    
    try:
        # Setup
        setup_example()
        
        # Run examples
        example_database_operations()
        example_redis_caching()
        example_dashboard_metrics()
        example_relationships()
        
        print("=" * 60)
        print("✅ All examples completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error running examples: {e}")
        print("\nTroubleshooting:")
        print("  1. Make sure PostgreSQL is running")
        print("  2. Make sure Redis is running")
        print("  3. Check your .env file configuration")
        print("  4. Run: pip install -r requirements.txt")


if __name__ == "__main__":
    main()
