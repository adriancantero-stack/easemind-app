# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY backend/requirements.txt /app/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy backend code
COPY backend /app

# Expose port
EXPOSE 8001

# Start command - use shell form to allow env var expansion
CMD uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001} --workers 1
