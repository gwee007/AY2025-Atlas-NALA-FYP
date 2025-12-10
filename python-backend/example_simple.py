"""
Example usage of the simplified chatbot database structure.

This demonstrates how to work with the simplified ER diagram:
    ROOT_OBJECT (Chatbot) → USER → CONVERSATION → MESSAGE
"""

from database_simple import (
    get_db_session,
    create_chatbot,
    get_chatbot,
    create_user,
    get_user,
    create_conversation,
    get_conversation,
    create_message,
    get_messages,
    create_question,
    get_question,
    update_question,
    create_answer,
    get_answer_by_question,
    update_answer
)
import json


def example_basic_operations():
    """Basic CRUD operations following the ER diagram structure"""
    
    print("\n" + "=" * 60)
    print("EXAMPLE: Basic Operations")
    print("=" * 60)
    
    # 1. Create ROOT_OBJECT (Chatbot)
    print("\n1. Creating chatbot (ROOT_OBJECT)...")
    chatbot_id = create_chatbot()
    
    # 2. Create USER
    print("\n2. Creating user...")
    user_id = create_user(chatbot_id)
    
    # 3. Create CONVERSATION
    print("\n3. Creating conversation...")
    conv_id = create_conversation(user_id, "Python Programming Help")
    
    # 4. Create MESSAGEs
    print("\n4. Creating messages...")
    create_message(conv_id, "user", "How do I create a list in Python?")
    create_message(conv_id, "bot", "You can create a list using square brackets: my_list = [1, 2, 3]")
    create_message(conv_id, "user", "Thanks! What about dictionaries?")
    create_message(conv_id, "bot", "Dictionaries use curly braces: my_dict = {'key': 'value'}")
    
    # 5. Retrieve full structure
    print("\n5. Retrieving full chatbot structure...")
    chatbot_data = get_chatbot(chatbot_id)
    print("\nFull data structure:")
    print(json.dumps(chatbot_data, indent=2))
    
    return chatbot_id, user_id, conv_id


def example_multiple_users():
    """Example with multiple users and conversations"""
    
    print("\n" + "=" * 60)
    print("EXAMPLE: Multiple Users and Conversations")
    print("=" * 60)
    
    # Create chatbot
    chatbot_id = create_chatbot()
    
    # Create multiple users
    print("\nCreating 3 users...")
    user1 = create_user(chatbot_id)
    user2 = create_user(chatbot_id)
    user3 = create_user(chatbot_id)
    
    # User 1: Multiple conversations
    print("\nUser 1: Creating 2 conversations...")
    conv1_1 = create_conversation(user1, "Introduction to JavaScript")
    conv1_2 = create_conversation(user1, "React Components")
    
    create_message(conv1_1, "user", "What is JavaScript?")
    create_message(conv1_1, "bot", "JavaScript is a programming language for web development.")
    
    create_message(conv1_2, "user", "How do I create a React component?")
    create_message(conv1_2, "bot", "You can use function components or class components.")
    
    # User 2: Single conversation
    print("\nUser 2: Creating 1 conversation...")
    conv2_1 = create_conversation(user2, "SQL Queries")
    create_message(conv2_1, "user", "What is a JOIN in SQL?")
    create_message(conv2_1, "bot", "A JOIN combines rows from two or more tables.")
    
    # User 3: No conversations yet
    print("\nUser 3: No conversations (empty history)")
    
    # Display results
    print("\n" + "-" * 60)
    print("Chatbot Summary:")
    print("-" * 60)
    chatbot_data = get_chatbot(chatbot_id)
    print(f"Total Users: {chatbot_data['users_count']}")
    print(f"Users with data: {len(chatbot_data['users'])}")
    
    for i, user in enumerate(chatbot_data['users'], 1):
        print(f"\nUser {i} (ID: {user['user_id']}):")
        print(f"  - Conversations: {user['conversations_count']}")
        for conv in user['conversations']:
            msg_count = len(conv.get('messages', []))
            print(f"    • '{conv['title']}' - {msg_count} messages")
    
    return chatbot_id


def example_retrieve_user_data():
    """Example: Retrieve specific user's conversation history"""
    
    print("\n" + "=" * 60)
    print("EXAMPLE: Retrieve User Data")
    print("=" * 60)
    
    # Setup
    chatbot_id = create_chatbot()
    user_id = create_user(chatbot_id)
    
    # Create multiple conversations
    conv1 = create_conversation(user_id, "Topic: Machine Learning")
    conv2 = create_conversation(user_id, "Topic: Data Science")
    conv3 = create_conversation(user_id, "Topic: Neural Networks")
    
    # Add messages
    create_message(conv1, "user", "What is supervised learning?")
    create_message(conv1, "bot", "Supervised learning uses labeled data...")
    
    create_message(conv2, "user", "Explain data preprocessing")
    create_message(conv2, "bot", "Data preprocessing involves cleaning...")
    
    create_message(conv3, "user", "How do neural networks work?")
    
    # Retrieve user data
    print(f"\nRetrieving all data for User ID: {user_id}")
    user_data = get_user(user_id)
    
    print("\nUser's Conversation History:")
    print(json.dumps(user_data, indent=2))
    
    return user_id


def example_conversation_details():
    """Example: Get detailed conversation with messages"""
    
    print("\n" + "=" * 60)
    print("EXAMPLE: Conversation Details")
    print("=" * 60)
    
    # Setup
    chatbot_id = create_chatbot()
    user_id = create_user(chatbot_id)
    conv_id = create_conversation(user_id, "Debug Help Session")
    
    # Simulate a debugging conversation
    messages = [
        ("user", "My code has an error"),
        ("bot", "Can you share the error message?"),
        ("user", "IndexError: list index out of range"),
        ("bot", "This means you're trying to access an index that doesn't exist."),
        ("user", "How do I fix it?"),
        ("bot", "Check your loop conditions and array bounds."),
        ("user", "Got it! Thanks!"),
        ("bot", "You're welcome! Let me know if you need more help.")
    ]
    
    print(f"\nCreating conversation with {len(messages)} messages...")
    for sender, content in messages:
        create_message(conv_id, sender, content)
    
    # Retrieve conversation
    print(f"\nRetrieving conversation ID: {conv_id}")
    conv_data = get_conversation(conv_id)
    
    print("\nConversation Details:")
    print(f"Title: {conv_data['title']}")
    print(f"Created: {conv_data['created_at']}")
    print(f"Updated: {conv_data['updated_at']}")
    print(f"Messages: {len(conv_data['messages'])}")
    
    print("\nMessage Thread:")
    for i, msg in enumerate(conv_data['messages'], 1):
        sender_icon = "👤" if msg['sender'] == "user" else "🤖"
        print(f"{i}. {sender_icon} {msg['sender']}: {msg['content']}")
    
    return conv_id


def example_questions_and_answers():
    """Example: Creating questions and answers with assessment data"""
    
    print("\n" + "=" * 60)
    print("EXAMPLE: Questions and Answers")
    print("=" * 60)
    
    # Setup
    chatbot_id = create_chatbot()
    user_id = create_user(chatbot_id)
    conv_id = create_conversation(user_id, "Python Learning Session")
    
    print("\n Creating Q&A pairs...")
    
    # Q&A Pair 1: Question with answer
    print("\n1. Question: 'What is a list in Python?'")
    msg_q1 = create_message(conv_id, "user", "What is a list in Python?")
    q1_id = create_question(
        message_id=msg_q1,
        grade="A",
        feedback="Good fundamental question",
        solo_taxonomy_label="Unistructural",
        duration=15
    )
    
    msg_a1 = create_message(conv_id, "bot", "A list is an ordered collection of items...")
    a1_id = create_answer(
        question_id=q1_id,
        message_id=msg_a1,
        accuracy=98,
        feedback="Comprehensive and accurate answer"
    )
    
    # Q&A Pair 2: Question with answer
    print("\n2. Question: 'How do I sort a list?'")
    msg_q2 = create_message(conv_id, "user", "How do I sort a list?")
    q2_id = create_question(
        message_id=msg_q2,
        grade="B+",
        feedback="Practical application question",
        solo_taxonomy_label="Relational",
        duration=20
    )
    
    msg_a2 = create_message(conv_id, "bot", "Use .sort() method or sorted() function...")
    a2_id = create_answer(
        question_id=q2_id,
        message_id=msg_a2,
        accuracy=95,
        feedback="Clear explanation with examples"
    )
    
    # Question 3: No answer yet
    print("\n3. Question: 'What about dictionaries?' (No answer yet)")
    msg_q3 = create_message(conv_id, "user", "What about dictionaries?")
    q3_id = create_question(
        message_id=msg_q3,
        grade="B",
        solo_taxonomy_label="Multistructural",
        duration=10
    )
    
    # Display results
    print("\n" + "-" * 60)
    print("Question & Answer Summary:")
    print("-" * 60)
    
    for qid in [q1_id, q2_id, q3_id]:
        question = get_question(qid)
        print(f"\nQuestion ID {question['question_id']}:")
        print(f"  Grade: {question['grade']}")
        print(f"  SOLO Level: {question['solo_taxonomy_label']}")
        print(f"  Duration: {question['duration']}s")
        
        if question['answer']:
            print(f"  ✅ Answer: ID {question['answer']['answer_id']}")
            print(f"     Accuracy: {question['answer']['accuracy']}%")
            print(f"     Feedback: {question['answer']['feedback']}")
        else:
            print(f"  ❌ No answer yet")
    
    # Update example
    print("\n" + "-" * 60)
    print("Updating Question Grade...")
    print("-" * 60)
    update_question(q3_id, grade="A-", feedback="Good follow-up question")
    
    print("\nNow adding answer to Question 3...")
    msg_a3 = create_message(conv_id, "bot", "Dictionaries store key-value pairs...")
    a3_id = create_answer(
        question_id=q3_id,
        message_id=msg_a3,
        accuracy=97,
        feedback="Excellent detailed explanation"
    )
    
    print("\n✅ Updated Question 3:")
    updated_q3 = get_question(q3_id)
    print(json.dumps(updated_q3, indent=2))
    
    return conv_id


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print(" SIMPLIFIED CHATBOT DATABASE - EXAMPLE USAGE ".center(70))
    print("=" * 70)
    
    print("\nThis demonstrates the simplified ER diagram structure:")
    print("  ROOT_OBJECT (Chatbot) → USER → CONVERSATION → MESSAGE")
    print()
    
    try:
        # Run examples
        print("\nSelect an example to run:")
        print("1. Basic operations (create chatbot → user → conversation → messages)")
        print("2. Multiple users and conversations")
        print("3. Retrieve user data")
        print("4. Conversation details")
        print("5. Questions and answers (NEW!)")
        print("6. Run all examples")
        
        choice = input("\nEnter choice (1-6): ").strip()
        
        if choice == "1":
            example_basic_operations()
        elif choice == "2":
            example_multiple_users()
        elif choice == "3":
            example_retrieve_user_data()
        elif choice == "4":
            example_conversation_details()
        elif choice == "5":
            example_questions_and_answers()
        elif choice == "6":
            example_basic_operations()
            example_multiple_users()
            example_retrieve_user_data()
            example_conversation_details()
            example_questions_and_answers()
        else:
            print("Invalid choice. Running basic operations...")
            example_basic_operations()
        
        print("\n" + "=" * 70)
        print(" EXAMPLES COMPLETED SUCCESSFULLY ".center(70))
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error running examples: {e}")
        import traceback
        traceback.print_exc()
