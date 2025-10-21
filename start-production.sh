#!/bin/bash

# EaseMind - Production Startup Script
# Inicia Backend, Frontend, Website e Nginx

set -e

echo "========================================"
echo "🚀 EaseMind - Starting Production"
echo "========================================"

# Criar diretórios de logs
mkdir -p /tmp/logs

# 1. Iniciar Backend (FastAPI)
echo "[1/4] Starting Backend (port 8001)..."
cd /app/backend
python3 server.py > /tmp/logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Aguardar backend iniciar
sleep 5

# 2. Iniciar Frontend (Expo)
echo "[2/4] Starting Frontend (port 3000)..."
cd /app/frontend
yarn start --port 3000 > /tmp/logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

# Aguardar frontend iniciar
sleep 10

# 3. Iniciar Website (Express)
echo "[3/4] Starting Website (port 9000)..."
cd /app/website
node server.js > /tmp/logs/website.log 2>&1 &
WEBSITE_PID=$!
echo "✅ Website started (PID: $WEBSITE_PID)"

# Aguardar website iniciar
sleep 3

# 4. Iniciar Nginx (Proxy Reverso)
echo "[4/4] Starting Nginx (port 80)..."
nginx -c /app/nginx.conf -g 'daemon off;' > /tmp/logs/nginx.log 2>&1 &
NGINX_PID=$!
echo "✅ Nginx started (PID: $NGINX_PID)"

echo ""
echo "========================================"
echo "✅ All Services Running!"
echo "========================================"
echo "Backend:  http://localhost:8001"
echo "Frontend: http://localhost:3000"
echo "Website:  http://localhost:9000"
echo "Nginx:    http://localhost:80"
echo ""
echo "Public Access:"
echo "easemind.io/         → Website"
echo "easemind.io/app      → Frontend"
echo "easemind.io/api/*    → Backend"
echo "========================================"

# Função para encerrar todos os processos
cleanup() {
    echo "\n⚠️  Shutting down services..."
    kill $NGINX_PID $WEBSITE_PID $FRONTEND_PID $BACKEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Manter o script rodando e monitorar logs
echo "📋 Monitoring logs (Ctrl+C to stop)..."
echo ""
tail -f /tmp/logs/*.log
