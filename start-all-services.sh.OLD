#!/bin/bash

# EaseMind - Start All Services + Unified Proxy
# Inicia Backend, Frontend, Website e Proxy Server

set -e  # Exit on error

echo "=========================================="
echo "🚀 EaseMind - Starting All Services"
echo "=========================================="

# Step 0: Configure Nginx first
echo ""
echo "[0/4] Configuring Nginx..."
bash /app/configure-nginx.sh || echo "⚠️  Nginx config failed, continuing anyway..."

# Create log directory
mkdir -p /tmp/easemind-logs

# 1. Start Backend (FastAPI)
echo ""
echo "[1/4] Starting Backend (FastAPI on :8001)..."
cd /app/backend
python3 server.py > /tmp/easemind-logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
echo "Waiting for backend..."
for i in {1..30}; do
  if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "✅ Backend is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Backend failed to start"
    exit 1
  fi
  sleep 1
done

# 2. Start Frontend (Expo)
echo ""
echo "[2/4] Starting Frontend (Expo on :3000)..."
cd /app/frontend
export CI=true
yarn start --port 3000 > /tmp/easemind-logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo "Waiting for frontend (15s)..."
sleep 15

# 3. Start Website (Express)
echo ""
echo "[3/4] Starting Website (Express on :9000)..."
cd /app/website
node server.js > /tmp/easemind-logs/website.log 2>&1 &
WEBSITE_PID=$!
echo "✅ Website started (PID: $WEBSITE_PID)"

# Wait for website to be ready
echo "Waiting for website..."
for i in {1..10}; do
  if curl -s http://localhost:9000 > /dev/null 2>&1; then
    echo "✅ Website is ready!"
    break
  fi
  sleep 1
done

# 4. Start Unified Proxy Server (Node.js)
echo ""
echo "[4/4] Starting Unified Proxy Server on :8080..."
cd /app
node unified-server.js > /tmp/easemind-logs/proxy.log 2>&1 &
PROXY_PID=$!
echo "✅ Proxy Server started (PID: $PROXY_PID)"
sleep 2

# Summary
echo ""
echo "=========================================="
echo "✅ All Services Running!"
echo "=========================================="
echo "Backend:  http://localhost:8001"
echo "Frontend: http://localhost:3000"
echo "Website:  http://localhost:9000"
echo "Proxy:    http://localhost:8080"
echo ""
echo "Public Routes (via :80 → :8080):"
echo "  /            → Website"
echo "  /app         → Frontend"
echo "  /api/*       → Backend"
echo ""
echo "PIDs:"
echo "  Backend:  $BACKEND_PID"
echo "  Frontend: $FRONTEND_PID"
echo "  Website:  $WEBSITE_PID"
echo "  Proxy:    $PROXY_PID"
echo "=========================================="
echo ""
echo "📋 Monitoring logs..."
echo ""

# Function to cleanup
cleanup() {
    echo "\n⚠️  Shutting down services..."
    kill $PROXY_PID $WEBSITE_PID $FRONTEND_PID $BACKEND_PID 2>/dev/null || true
    echo "✅ Services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Monitor logs
tail -f /tmp/easemind-logs/*.log
