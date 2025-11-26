#!/bin/bash
# Railway Start Script - EaseMind Backend
echo "🚀 Starting EaseMind Backend on Railway..."

# Navigate to backend directory and start uvicorn
cd /app/backend
exec uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001} --workers 1
