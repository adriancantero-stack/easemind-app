#!/bin/bash
# Railway Start Script - EaseMind Backend Only
echo "🚀 Starting EaseMind Backend for Railway..."

# Navigate to backend directory
cd backend

# Load environment variables
export $(cat .env | grep -v '^#' | xargs) 2>/dev/null || true

# Start FastAPI with uvicorn
echo "✅ Starting FastAPI on port $PORT..."
uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}
