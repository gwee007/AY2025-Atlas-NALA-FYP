# NALA - Assessment System with AI-Powered Chatbot

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 19 + Vite, Material-UI, D3.js |
| Backend | Python (Flask/FastAPI), SQLAlchemy |
| Dashboard | Node.js, Express |
| Database | PostgreSQL 18 + pgvector |
| Cache | Redis 7 |
| AI Models | BGE-M3, BGE-Reranker-v2-m3 |
| Containerization | Docker & Docker Compose |

## Prerequisites
- **Docker & Docker Compose** (v2.0+)
- **10GB+ free disk space** (for models and databases)

### Setup (Docker - Recommended)

```bash
# 1. Clone repository
git clone <repository-url>
cd AY2025-Atlas-NALA-FYP

# 2. Build and start all services
docker-compose up --build

# 3. Wait for model download and database initialization (~2-5 minutes)
```

### Access Services

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost | Main UI |
| Chatbot API | http://localhost:8000 | Question/answer endpoints |
| Dashboard API | http://localhost:8001 | Analytics & grading |
| PostgreSQL | localhost:5432 | Database (user: postgres, pass: psw18) |
| Redis | localhost:6379 | Cache server |

### Stop Services

```bash
docker-compose down

# Remove volumes (database data, cache, models)
docker-compose down -v
```

---

## Local Development

### Backend Setup

```bash
cd chatbot-backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with database credentials
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=psw18
# POSTGRES_HOST=localhost
# POSTGRES_DB=nala_assess
# POSTGRES_PORT=5432

# Run backend
python run.py  # Runs on http://localhost:8000
```

### Frontend Setup

```bash
cd chatbot-frontend

# Install dependencies
npm install

# Start development server
npm run dev  # Runs on http://localhost:5173

# Build for production
npm run build

# Lint code
npm run lint
```

### Dashboard Backend Setup

```bash
cd chatbot-backend/dashboard_backend

# Install dependencies
npm install

# Run server
node api_server.js  # Runs on http://localhost:8001
```

## Architecture

### Docker Services

1. **model-loader**: Downloads BGE models to shared volume (runs once)
2. **db (PostgreSQL)**: Main database with pgvector extension
3. **redis**: In-memory cache (AOF persistence enabled)
4. **backend**: Python application (port 8000)
5. **dashboard-backend**: Node.js analytics server (port 8001)
6. **frontend**: React application (port 80)

## Database Initialization Pipeline

```
db-init-1-tables → db-init-2-indexes → db-init-3-data → main db
   (Creates)          (Indexes)           (Seed data)
```

## Database Setup (Manual)

If not using Docker, initialize manually:

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost -d nala_assess

# Run initialization scripts in order
\i init-scripts/01-create-tables.sql
\i init-scripts/02-create-indexes-triggers.sql
\i init-scripts/03-insert-data.sql
```

## Environment Variables

### Backend (.env in `chatbot-backend/`)
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=psw18
POSTGRES_HOST=db
POSTGRES_DB=nala_assess
POSTGRES_PORT=5432
REDIS_HOST=redis
REDIS_PORT=6379
```

### Frontend (.env in `chatbot-frontend/`)
```env
VITE_API_URL=http://localhost:8000
```
