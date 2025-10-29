from http.server import BaseHTTPRequestHandler
import json
import os
from pymongo import MongoClient
from datetime import datetime

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client['easemind']

users_collection = db['users']
conversations_collection = db['conversations']

# Simulated LLM (you'll need to add emergentintegrations or openai)
class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            message = data.get('message', '')
            user_id = data.get('user_id', 'guest')
            history = data.get('history', [])
            
            # Get user context
            user = users_collection.find_one({"firebase_uid": user_id}) or users_collection.find_one({"user_id": user_id})
            
            # Simple system prompt (you can enhance this)
            system_prompt = """You are Luna, a warm and empathetic emotional support companion.
You help people with anxiety, stress, and emotional challenges using CBT, mindfulness, and positive psychology.
Keep responses short (1-3 paragraphs), warm, and actionable."""
            
            # Here you would call LLM API (OpenAI, Anthropic, etc)
            # For now, a simple response
            response_text = f"I hear you. Thank you for sharing that with me. How are you feeling right now?"
            
            # Save conversation
            conversations_collection.insert_one({
                "user_id": user_id,
                "message": message,
                "response": response_text,
                "created_at": datetime.utcnow()
            })
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            result = {
                "response": response_text,
                "correlation_id": "serverless"
            }
            
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
