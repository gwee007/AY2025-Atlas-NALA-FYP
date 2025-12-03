# Simplified Chatbot Database

This is a simplified version of the backend that matches your ER diagram structure.

## ER Diagram Structure

```
ROOT_OBJECT (Chatbot)
    └── USER (multiple users)
        └── CONVERSATION (chat history)
            └── MESSAGE (chat content - currently nullable)
```

## Database Schema

### Tables

1. **`chatbot`** (ROOT_OBJECT)
   - `chatbot_id` (PK) - ID of the system/bot
   - `users_count` - Total users stored

2. **`user`**
   - `user_id` (PK) - Unique ID for the user
   - `chatbot_id` (FK) - Links to chatbot
   - `conversations_count` - Total chats by this user

3. **`conversation`**
   - `id` (PK) - Unique ID for the specific chat
   - `user_id` (FK) - Links to user
   - `title` - Summary or first message
   - `created_at` - ISO 8601 start time
   - `updated_at` - ISO 8601 last active time

4. **`message`**
   - `message_id` (PK)
   - `conversation_id` (FK)
   - `sender` - 'user' or 'bot'
   - `content` - Message text
   - `timestamp` - When message was sent
   - `metadata` - Additional data (JSON)

## Files

- **`models_simple.py`** - Simplified SQLAlchemy models
- **`database_simple.py`** - Database connection and operations
- **`example_simple.py`** - Usage examples

## Setup

1. **Configure Database URL**
   ```bash
   # Edit .env file
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nala_simple
   ```

2. **Install Requirements**
   ```bash
   pip install sqlalchemy psycopg2-binary python-dotenv
   ```

3. **Initialize Database**
   ```bash
   python database_simple.py
   # Select 'y' to create tables
   # Select 'y' to create sample data
   ```

## Usage Examples

### Basic Operations

```python
from database_simple import (
    create_chatbot, create_user, 
    create_conversation, create_message,
    get_chatbot
)

# 1. Create chatbot (ROOT_OBJECT)
chatbot_id = create_chatbot()

# 2. Create user
user_id = create_user(chatbot_id)

# 3. Create conversation
conv_id = create_conversation(user_id, "Python Help")

# 4. Add messages
create_message(conv_id, "user", "How do I create a list?")
create_message(conv_id, "bot", "Use square brackets: [1, 2, 3]")

# 5. Get full structure
chatbot_data = get_chatbot(chatbot_id)
# Returns nested structure: chatbot → users → conversations → messages
```

### Run Examples

```bash
python example_simple.py
```

## API Functions

### Chatbot Operations
- `create_chatbot()` - Create new chatbot
- `get_chatbot(chatbot_id)` - Get full nested structure

### User Operations
- `create_user(chatbot_id)` - Create user under chatbot
- `get_user(user_id)` - Get user with conversations

### Conversation Operations
- `create_conversation(user_id, title)` - Create new conversation
- `get_conversation(conv_id)` - Get conversation with messages
- `update_conversation_timestamp(conv_id)` - Update last active time

### Message Operations
- `create_message(conv_id, sender, content, metadata=None)` - Add message
- `get_messages(conv_id)` - Get all messages in conversation

## Data Structure Example

```json
{
  "chatbot_id": 1,
  "users_count": 2,
  "users": [
    {
      "user_id": 1,
      "conversations_count": 2,
      "conversations": [
        {
          "id": 1,
          "title": "Python Programming",
          "created_at": "2024-10-10T14:30:00",
          "updated_at": "2024-10-10T15:45:00",
          "messages": [
            {
              "message_id": 1,
              "sender": "user",
              "content": "What is Python?",
              "timestamp": "2024-10-10T14:30:00",
              "metadata": null
            },
            {
              "message_id": 2,
              "sender": "bot",
              "content": "Python is a programming language...",
              "timestamp": "2024-10-10T14:30:15",
              "metadata": null
            }
          ]
        }
      ]
    }
  ]
}
```

## Differences from Complex Schema

The original `models.py` has these additional tables that are **NOT** in the simplified version:
- `ActivityLog` - User activity tracking
- `Course` - Course information
- `Topic` - Learning topics
- `Question` - Question assessment
- `Answer` - Answer assessment  
- `Consent` / `ConsentForm` - Research consent
- `ProdConfig` / `SandboxConfig` - System configuration
- `InteractionData` / `GradingData` - Analytics

Use **`models_simple.py`** when you only need the basic chatbot conversation structure.

Use **`models.py`** when you need the full learning analytics platform with assessments and compliance.
