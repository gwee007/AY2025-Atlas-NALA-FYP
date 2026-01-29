# Docker Compose Setup for NALA

This Docker Compose configuration follows specific architectural rules for production deployment on AWS.

## Architecture Overview

### Key Features

1. **No Internal Health Checks**: All health monitoring is delegated to the AWS Load Balancer on port 80
2. **Split Database Initialization**: Database setup is divided into three sequential steps
3. **Model Loader**: Temporary container downloads AI models to a shared volume
4. **Containerized Dependencies**: All Python and Node dependencies are inside containers

## Services

### 1. Model Loader (`model-loader`)
- **Type**: Temporary container (exits after completion)
- **Purpose**: Downloads AI models (BGE-M3 and BGE-Reranker-v2-m3) using wget
- **Volume**: Stores models in `ai_models` volume
- **Restart Policy**: `no` (runs once and exits)

### 2. Database Initialization (3 Stages)

#### Stage 1: `db-init-1-tables`
- Creates all database tables
- Enables pgvector extension
- **Script**: `init-scripts/01-create-tables.sql`
- Exits after completion

#### Stage 2: `db-init-2-indexes`
- Creates indexes (including HNSW vector index)
- Creates database triggers
- **Script**: `init-scripts/02-create-indexes-triggers.sql`
- Depends on: `db-init-1-tables`
- Exits after completion

#### Stage 3: `db-init-3-data`
- Inserts initial seed data
- **Script**: `init-scripts/03-insert-data.sql`
- Depends on: `db-init-2-indexes`
- Exits after completion

### 3. Main Database (`db`)
- **Image**: `ankane/pgvector:latest`
- **Port**: 5432
- **Volume**: `postgres_data`
- **Credentials**:
  - User: postgres
  - Password: dA^WPvd@5rRFcGB@ehI8
  - Database: nala
- Depends on: `db-init-3-data`

### 4. Redis Cache (`redis`)
- **Image**: `redis:7-alpine`
- **Port**: 6379
- **Volume**: `redis_data`
- Configured with AOF persistence

### 5. Backend (`backend`)
- **Port**: 8000
- **Volumes**: Mounts `ai_models` volume (read-only)
- **Dependencies**: 
  - Database (PostgreSQL)
  - Redis
  - Model loader
- Built from `chatbot-backend/Dockerfile`

### 6. Dashboard Backend (`dashboard-backend`)
- **Port**: 8001
- **Dependencies**: 
  - Database (PostgreSQL)
  - Redis
- Built from `chatbot-backend/dashboard_backend/Dockerfile`

### 7. Frontend (`frontend`)
- **Port**: 80 (AWS Load Balancer monitors this port)
- **Dependencies**: 
  - Backend
  - Dashboard Backend
- Built from `chatbot-frontend/Dockerfile`
- Environment: `VITE_API_URL` can be configured

## Volumes

- **postgres_data**: Persistent PostgreSQL data
- **redis_data**: Persistent Redis data
- **ai_models**: Shared volume for AI models (created by model-loader, used by backend)

## Deployment Instructions

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 10GB+ free disk space (for models and data)

### Initial Setup

1. **Clone and navigate to project**:
   ```bash
   cd /path/to/project
   ```

2. **Configure environment**:
   - Create `.env` file in `chatbot-backend/` directory
   - Set required environment variables (API keys, etc.)

3. **Start all services**:
   ```bash
   docker-compose up -d
   ```

### Startup Sequence

The services start in this order:

1. `model-loader` - Downloads AI models
2. `db-init-1-tables` - Creates database tables
3. `db-init-2-indexes` - Creates indexes and triggers
4. `db-init-3-data` - Inserts initial data
5. `db` - Main database starts
6. `redis` - Cache service starts
7. `backend` & `dashboard-backend` - API services start
8. `frontend` - Web interface starts

### Monitoring

```bash
# View all containers
docker-compose ps

# View logs for specific service
docker-compose logs -f backend

# View model loader completion
docker-compose logs model-loader

# Check database initialization
docker-compose logs db-init-1-tables
docker-compose logs db-init-2-indexes
docker-compose logs db-init-3-data
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (CAUTION: deletes all data)
docker-compose down -v
```

## AWS Load Balancer Configuration

The AWS Load Balancer should be configured to:
- Monitor port **80** (frontend)
- Health check endpoint: `http://<target>:80/`
- No internal Docker health checks are configured

## Troubleshooting

### Models not loading
```bash
# Check if model-loader completed successfully
docker-compose logs model-loader

# Verify models volume
docker volume inspect nala_ai_models
```

### Database connection issues
```bash
# Verify database initialization completed
docker-compose ps | grep db-init

# Check database logs
docker-compose logs db

# Test database connection
docker-compose exec db psql -U postgres -d nala -c "SELECT version();"
```

### Backend not starting
```bash
# Check if models are available
docker-compose exec backend ls -la /models

# Check environment variables
docker-compose exec backend env | grep DATABASE

# View backend logs
docker-compose logs -f backend
```

## Updating Components

### Update models
```bash
# Remove existing models volume
docker-compose down
docker volume rm nala_ai_models

# Restart (will re-download models)
docker-compose up -d model-loader
```

### Update database schema
```bash
# Edit initialization scripts
# Then recreate database
docker-compose down db
docker volume rm nala_postgres_data
docker-compose up -d
```

## Production Notes

1. **Change default credentials** before deploying to production
2. **Secure .env files** - never commit to version control
3. **Configure proper networking** for AWS VPC
4. **Set up CloudWatch** for log aggregation
5. **Configure auto-scaling** based on AWS Load Balancer metrics
6. **Backup volumes** regularly using AWS EBS snapshots

## File Structure

```
.
├── docker-compose.yml
├── init-scripts/
│   ├── 01-create-tables.sql
│   ├── 02-create-indexes-triggers.sql
│   └── 03-insert-data.sql
├── scripts/
│   └── download-models.sh
├── chatbot-backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env
│   └── dashboard_backend/
│       ├── Dockerfile
│       └── requirements.txt
└── chatbot-frontend/
    └── Dockerfile
```
