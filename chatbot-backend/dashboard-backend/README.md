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

.env.example to be set up so that the following can be done: 

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
# Connect to database and initialise connection
python initialize_database.py
```

## Environment Variables
For Postgres configuration, .env variables are as follows: 
| Variable | Description | Value/Placeholder |
| :--- | :--- | :--- |
| **POSTGRES_USER** | The database username | Contact for user details |
| **POSTGRES_PASS** | The database password | Contact for password |
| **POSTGRES_HOST** | Database server host address | `aws-1-ap-southeast-1.pooler.supabase.com` |
| **POSTGRES_DB** | Name of the specific database | `postgres` |
| **POSTGRES_PORT** | Port number for connection | `5432` |
| **NALA_API_KEY** | For connecting to NALA API services | Contact NALA team for details |
| **TIMEOUT** | Time limit for API requests before expiration | 15 |
