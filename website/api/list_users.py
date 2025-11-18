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

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Get all users with relevant information
            users = list(users_collection.find(
                {},
                {
                    '_id': 0,
                    'firebase_uid': 1,
                    'email': 1,
                    'display_name': 1,
                    'language': 1,
                    'created_at': 1,
                    'last_login': 1,
                    'is_premium': 1,
                    'subscription_status': 1,
                    'plan': 1
                }
            ).sort('created_at', -1).limit(100))
            
            # Convert datetime to string for JSON serialization
            for user in users:
                if 'created_at' in user and user['created_at']:
                    user['created_at'] = user['created_at'].isoformat()
                if 'last_login' in user and user['last_login']:
                    user['last_login'] = user['last_login'].isoformat()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'users': users,
                'total': len(users)
            }).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
