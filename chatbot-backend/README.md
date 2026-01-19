# Chatbot Backend

This is the AI-powered chatbot backend for the NALA assessment system. It handles question evaluation using SOLO taxonomy and answer evaluation with RAG (Retrieval-Augmented Generation).

## Architecture

- **Flask** web framework
- **SQLAlchemy** ORM with PostgreSQL (Supabase)
- **LLM Integration** via NALA API
- **RAG Service** for context-aware answer evaluation

## Components

### Core Modules
- `orchestrator.py` - Main workflow coordinator for question/answer processing
- `llm_client.py` - LLM API client for NALA integration
- `model_loader.py` - Model initialization and caching

### Services
- `question_eval.py` - SOLO taxonomy-based question evaluation
- `answer_eval.py` - RAG-based answer evaluation with feedback generation
- `rag_service.py` - Document retrieval and context generation

### API Routes
- `POST /api/chat` - Main chatbot endpoint for questions and answers
- `GET /api/conversations` - Get user conversations
- `GET /api/conversations/<id>/messages` - Get conversation messages
- `GET /api/health` - Health check

## Setup

### 1. Install Dependencies

```bash
cd chatbot-backend
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the `chatbot-backend` directory:

```env
# Database (Supabase)
POSTGRES_USER=your_user
POSTGRES_PASS=your_password
POSTGRES_HOST=your_host
POSTGRES_DB=your_database
POSTGRES_PORT=5432

# NALA API
NALA_API_KEY=your_nala_api_key
NALA_BASE_URL=your_nala_base_url
```

### 3. Run the Server

```bash
python run.py
```

The server will start on `http://127.0.0.1:8000`

## API Usage

### Chat Endpoint

**Request:**
```json
POST /api/chat
Content-Type: application/json

{
  "question": "What is a feedback control system?",
  "conversation_id": null,  // Optional, creates new if not provided
  "user_id": 1              // Optional, defaults to 1
}
```

**Response (Question Evaluation):**
```json
{
  "response": "Great question! Your question is classified as...",
  "conversation_id": "123",
  "evaluation_type": "QUESTION_GRADED",
  "question_id": 456,
  "metadata": {
    "solo_level": "RELATIONAL",
    "grade": "A",
    "reasoning": "...",
    "relevant_topic_ids": [1, 2],
    "relevant_subtopic_ids": [3, 4]
  }
}
```

**Response (Answer Evaluation):**
```json
{
  "response": "Accuracy Score: 85/100\n\nFeedback: ...",
  "conversation_id": "123",
  "evaluation_type": "ANSWER_EVALUATED",
  "answer_id": 789,
  "accuracy_score": 85
}
```

## Workflow

### Question Processing
1. User submits a question
2. Question is evaluated using SOLO taxonomy
3. If technically relevant:
   - Graded (C/B/A/A+)
   - Linked to relevant topics/subtopics
   - Status set to "AWAITING_ANSWER"
4. Response returned to user

### Answer Processing
1. User submits an answer to a pending question
2. Relevant context retrieved via RAG service
3. Answer evaluated against retrieved documents
4. Feedback generated with:
   - Accuracy score (0-100)
   - Detailed feedback
   - Suggested answer
   - Higher-order thinking questions
5. Question status updated to "ANSWERED"

## Database Models

- **Conversation** - Chat sessions
- **Message** - Individual messages (user/bot)
- **Question** - Evaluated questions with SOLO level
- **Answer** - Student answers with scores
- **Topic** - Course topics
- **Subtopic** - Granular content areas

## Testing

Run the orchestrator tests:

```bash
python test_orchestrator.py
```

## Troubleshooting

### Models not loading
- Ensure NALA API credentials are correct in `.env`
- Check network connectivity to NALA API

### Database connection errors
- Verify Supabase credentials
- Check if database is accessible from your network

### Port already in use
- Change the port in `run.py`:
  ```python
  app.run(host='0.0.0.0', port=8001, debug=True)
  ```
