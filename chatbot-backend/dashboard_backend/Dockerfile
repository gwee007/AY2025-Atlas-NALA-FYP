FROM python:3.13-slim

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
COPY app /app/app

# Copy dashboard backend code
COPY dashboard_backend /app/dashboard_backend

# Set Python path to include /app so imports work
ENV PYTHONPATH=/app

WORKDIR /app

# Expose port
EXPOSE 8001

# Run with Gunicorn using module path
CMD ["gunicorn", "--bind", "0.0.0.0:8001", "--workers", "2", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "dashboard_backend.api_server:app"]
