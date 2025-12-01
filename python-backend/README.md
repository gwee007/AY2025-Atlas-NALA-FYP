# Python Backend - NALA Database

Python backend for the NALA (NTU Atlas Learning Assistant) project using SQLAlchemy ORM with PostgreSQL and Redis caching.

## Features

- **SQLAlchemy ORM**: Complete database models matching the NALA schema
- **PostgreSQL Database**: Relational database for storing user data, conversations, messages, and analytics
- **Redis Caching**: High-performance caching layer for dashboard statistics
- **Dashboard Metrics**: Comprehensive analytics and reporting functions

## Project Structure

```
python-backend/
├── models.py              # SQLAlchemy database models
├── database.py            # Database connection and session management
├── redis_cache.py         # Redis caching layer for dashboard stats
├── dashboard_metrics.py   # Analytics and metrics calculations
├── averageCalculation.py  # API endpoint testing utilities
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (not in git)
└── README.md             # This file
```

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your credentials:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nala
REDIS_URL=redis://localhost:6379
MY_API_KEY=your_api_key_here
```

### 3. Initialize Database

```python
from database import init_db

# Create all tables
init_db()
```

### 4. Test Connection

```bash
python database.py
```

## Database Models

All models are defined in `models.py`:

- **User**: User accounts and profiles
- **Course**: Course information
- **Chatbot**: Chatbot instances linked to courses
- **Conversation**: Chat sessions between users and chatbots
- **Message**: Individual messages within conversations
- **Topic**: Learning topics and taxonomy
- **Question**: Questions asked by students
- **Answer**: Answers provided by the chatbot
- **Consent**: User consent forms and agreements
- **GradingData**: Performance and grading information
- **InteractionData**: User interaction metrics

## Usage Examples

### Basic Database Operations

```python
from database import get_db_session
from models import User, Course

# Get a database session
db = get_db_session()

# Query users
users = db.query(User).all()

# Create a new user
new_user = User(
    hashed_id="hash_123",
    username="john_doe",
    email="john@example.com",
    password="hashed_password",
    group="students"
)
db.add(new_user)
db.commit()

# Close session
db.close()
```

### Using Redis Cache

```python
from redis_cache import init_redis, get_dashboard_stats, precompute_course_stats

# Initialize Redis
init_redis()

# Precompute statistics for a course
precompute_course_stats(course_id=1)

# Get complete dashboard stats
stats = get_dashboard_stats(course_id=1, user_id=123)
print(stats)
```

### Dashboard Metrics

```python
from dashboard_metrics import (
    get_course_overview,
    get_student_performance,
    get_engagement_metrics,
    get_complete_dashboard
)

# Get course overview
overview = get_course_overview(course_id=1)

# Get student performance
performance = get_student_performance(user_id=123, course_id=1)

# Get complete dashboard
dashboard = get_complete_dashboard(course_id=1, user_id=123)
```

## API Testing

Test NALA API endpoints using `averageCalculation.py`:

```bash
python averageCalculation.py
```

## Redis Caching Strategy

The caching layer implements:

- **TTL-based caching**: Different expiration times for different data types
- **Leaderboards**: Redis sorted sets for efficient ranking
- **Cache invalidation**: Smart invalidation when data changes
- **Precomputation**: Background jobs to precompute expensive queries

### Cache Keys

- `course:{id}:avg_score` - Course average quality score
- `course:{id}:avg_points` - Course average points
- `user:{id}:course:{id}:score` - User course score
- `leaderboard:course:{id}` - Course leaderboard (sorted set)

## Database Schema

The schema includes the following main entities:

1. **Users & Authentication**: User accounts, activity logs
2. **Courses & Chatbots**: Course structure and chatbot instances
3. **Conversations**: Chat sessions and messages
4. **Learning Content**: Topics, questions, answers with taxonomy labels
5. **Consent Management**: IRB consent forms and user consents
6. **Analytics**: Grading data, interaction metrics, performance tracking

## Development

### Run Tests

```bash
# Test database connection
python database.py

# Test Redis cache
python redis_cache.py

# Test dashboard metrics
python dashboard_metrics.py
```

### Create Database Migrations

When modifying models, you may want to use Alembic for migrations:

```bash
pip install alembic
alembic init alembic
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/nala` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `MY_API_KEY` | NALA API key | `pk_GWEE007_xxxxx` |
| `BASE_URL` | NALA base URL | `https://nala.ntu.edu.sg` |

## Notes

- Always use `get_db_session()` and close sessions after use to prevent connection leaks
- Redis client is a singleton - use `get_redis_client()` to access it
- Dashboard metrics support optional user_id filtering for personalized views
- All timestamps use UTC timezone

## License

[Your License Here]
