#!/bin/bash

# EaseMind - Configure Nginx on Deployment
# This script updates the system nginx configuration to proxy to our unified server

echo "🔧 Configuring Nginx for EaseMind..."

# Backup original config if exists
if [ -f /etc/nginx/sites-enabled/default ] && [ ! -f /etc/nginx/sites-enabled/default.backup ]; then
    sudo cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup
    echo "✅ Backed up original nginx config"
fi

# Write new nginx configuration
sudo tee /etc/nginx/sites-enabled/default > /dev/null <<'EOF'
##
# EaseMind - Unified Proxy Configuration
# Routes all traffic to unified-server.js on port 8080
##

server {
        listen 80 default_server;
        listen [::]:80 default_server;

        server_name _;

        # Proxy all traffic to unified server on port 8080
        location / {
                proxy_pass http://127.0.0.1:8080;
                proxy_http_version 1.1;
                
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                
                # WebSocket support for Expo HMR
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
                
                proxy_connect_timeout 60s;
                proxy_send_timeout 60s;
                proxy_read_timeout 60s;
                
                proxy_buffering off;
        }
}
EOF

echo "✅ Nginx configuration written"

# Test nginx configuration
if sudo nginx -t 2>&1 | grep -q "test is successful"; then
    echo "✅ Nginx configuration test passed"
    
    # Reload nginx
    sudo nginx -s reload
    echo "✅ Nginx reloaded successfully"
    
    echo ""
    echo "=========================================="
    echo "✅ Nginx configured for EaseMind routing"
    echo "=========================================="
    echo "Port 80 → Unified Server (8080) → Services"
    echo "  /          → Website (9000)"
    echo "  /app       → Frontend (3000)"
    echo "  /api/*     → Backend (8001)"
    echo "=========================================="
else
    echo "❌ Nginx configuration test failed"
    echo "Restoring backup..."
    sudo cp /etc/nginx/sites-enabled/default.backup /etc/nginx/sites-enabled/default
    exit 1
fi
