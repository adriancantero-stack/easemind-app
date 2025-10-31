#!/bin/bash
# Railway Simple Start - Only Backend
echo "🚀 Starting EaseMind Backend for Railway..."

# Activate venv and start uvicorn
. /opt/venv/bin/activate
cd /app/backend
exec uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}
