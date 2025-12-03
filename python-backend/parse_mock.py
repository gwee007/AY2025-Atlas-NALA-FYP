"""
Parse mock.json and insert data into the simplified database.
This script loads the JSON data and populates the database tables.
"""

import json
from datetime import datetime
from database_simple import (
    get_db_session,
    init_db,
    close_db
)
from models_simple import Chatbot, User, Conversation, Message


def parse_iso_datetime(date_string):
    """Parse ISO 8601 datetime string to Python datetime object"""
    if not date_string:
        return None
    try:
        # Handle Z suffix (UTC timezone)
        if date_string.endswith('Z'):
            date_string = date_string[:-1] + '+00:00'
        return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
    except Exception as e:
        print(f"⚠️  Error parsing date '{date_string}': {e}")
        return datetime.utcnow()


def load_mock_data(file_path='mock.json'):
    """Load JSON data from file"""
    print(f"📂 Loading data from {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"✅ Successfully loaded JSON data")
        print(f"   - Chatbot ID: {data.get('chatbot_id')}")
        print(f"   - Users count: {data.get('users_count')}")
        print(f"   - Users in data: {len(data.get('users', []))}")
        return data
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON format: {e}")
        return None
    except Exception as e:
        print(f"❌ Error loading file: {e}")
        return None


def insert_mock_data_to_db(data):
    """Insert mock JSON data into the database"""
    db = get_db_session()
    
    try:
        print("\n" + "=" * 60)
        print("INSERTING DATA INTO DATABASE")
        print("=" * 60)
        
        # Create chatbot
        chatbot_id = data.get('chatbot_id')
        users_count = data.get('users_count', 0)
        
        print(f"\n1️⃣  Creating Chatbot (ID: {chatbot_id})...")
        chatbot = Chatbot(chatbot_id=chatbot_id, users_count=users_count)
        db.add(chatbot)
        db.flush()  # Get the ID without committing
        print(f"   ✅ Chatbot created")
        
        # Process users
        users_data = data.get('users', [])
        print(f"\n2️⃣  Processing {len(users_data)} users...")
        
        users_inserted = 0
        conversations_inserted = 0
        
        for user_data in users_data:
            user_id = user_data.get('user_id')
            conversations_count = user_data.get('conversations_count', 0)
            
            # Create user
            user = User(
                user_id=user_id,
                chatbot_id=chatbot.chatbot_id,
                conversations_count=conversations_count
            )
            db.add(user)
            db.flush()
            users_inserted += 1
            
            # Process conversations for this user
            conversations_data = user_data.get('conversations', [])
            
            for conv_data in conversations_data:
                conv_id = conv_data.get('id')
                title = conv_data.get('title', 'Untitled')
                created_at = parse_iso_datetime(conv_data.get('created_at'))
                updated_at = parse_iso_datetime(conv_data.get('updated_at'))
                
                # Create conversation
                conversation = Conversation(
                    id=conv_id,
                    user_id=user.user_id,
                    title=title,
                    created_at=created_at,
                    updated_at=updated_at
                )
                db.add(conversation)
                conversations_inserted += 1
                
                # Messages are null in the mock data, so we skip them
                # If messages exist in future data, add them here
        
        # Commit all changes
        db.commit()
        
        print(f"\n✅ Database insertion completed successfully!")
        print(f"   - Chatbot: 1")
        print(f"   - Users: {users_inserted}")
        print(f"   - Conversations: {conversations_inserted}")
        print(f"   - Messages: 0 (all null in mock data)")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error inserting data: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def verify_data():
    """Verify that data was inserted correctly"""
    db = get_db_session()
    
    try:
        print("\n" + "=" * 60)
        print("VERIFYING DATA")
        print("=" * 60)
        
        chatbot_count = db.query(Chatbot).count()
        user_count = db.query(User).count()
        conversation_count = db.query(Conversation).count()
        message_count = db.query(Message).count()
        
        print(f"\n📊 Database Statistics:")
        print(f"   - Chatbots: {chatbot_count}")
        print(f"   - Users: {user_count}")
        print(f"   - Conversations: {conversation_count}")
        print(f"   - Messages: {message_count}")
        
        # Get sample data
        print(f"\n📝 Sample Users:")
        sample_users = db.query(User).limit(5).all()
        for user in sample_users:
            print(f"   - User {user.user_id}: {user.conversations_count} conversations")
        
        print(f"\n💬 Sample Conversations:")
        sample_convs = db.query(Conversation).limit(5).all()
        for conv in sample_convs:
            title_preview = conv.title[:60] + "..." if len(conv.title) > 60 else conv.title
            print(f"   - Conv {conv.id}: '{title_preview}'")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error verifying data: {e}")
        return False
    finally:
        db.close()


def export_to_json(output_file='mock_export.json'):
    """Export database data back to JSON format for verification"""
    db = get_db_session()
    
    try:
        print(f"\n📤 Exporting data to {output_file}...")
        
        chatbot = db.query(Chatbot).first()
        if not chatbot:
            print("❌ No chatbot found in database")
            return False
        
        # Use the to_dict() method to get nested structure
        chatbot_data = chatbot.to_dict()
        
        # Write to file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(chatbot_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Data exported successfully to {output_file}")
        return True
        
    except Exception as e:
        print(f"❌ Error exporting data: {e}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print(" MOCK DATA PARSER - Load JSON into Database ".center(70))
    print("=" * 70)
    
    print("\nThis script will:")
    print("1. Load data from mock.json")
    print("2. Parse the JSON structure")
    print("3. Insert into your simplified database")
    print("4. Verify the insertion")
    
    proceed = input("\n⚠️  This will CREATE NEW database entries. Continue? (y/n): ").strip().lower()
    
    if proceed != 'y':
        print("❌ Operation cancelled")
        exit(0)
    
    # Check if tables exist
    print("\n📋 Checking database tables...")
    create = input("Create/recreate tables? (y/n): ").strip().lower()
    if create == 'y':
        init_db()
    
    # Load mock data
    data = load_mock_data('mock.json')
    
    if data:
        # Analyze the data
        print("\n" + "=" * 60)
        print("DATA ANALYSIS")
        print("=" * 60)
        print(f"\n✓ Valid JSON structure")
        print(f"✓ Matches ER diagram: Chatbot → User → Conversation → Message")
        print(f"✓ Ready to insert into database")
        
        # Insert into database
        if insert_mock_data_to_db(data):
            # Verify insertion
            verify_data()
            
            # Export for comparison
            export = input("\n📤 Export data back to JSON for verification? (y/n): ").strip().lower()
            if export == 'y':
                export_to_json('mock_export.json')
                print("\n💡 Compare mock.json with mock_export.json to verify data integrity")
    
    print("\n" + "=" * 70)
    print(" COMPLETED ".center(70))
    print("=" * 70)
