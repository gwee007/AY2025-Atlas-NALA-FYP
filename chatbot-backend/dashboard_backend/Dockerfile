FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy parent app directory for shared modules
COPY ../app /app/app

# Copy dashboard backend code
COPY . /app/dashboard_backend

WORKDIR /app/dashboard_backend

# Expose port
EXPOSE 8001

# Run with Gunicorn
CMD gunicorn --bind 0.0.0.0:8001 --workers 2 --timeout 120 --access-logfile - --error-logfile - api_server:app
