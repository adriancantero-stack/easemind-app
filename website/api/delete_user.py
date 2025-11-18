from http.server import BaseHTTPRequestHandler
import json
import os
from pymongo import MongoClient

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client['easemind']

class handler(BaseHTTPRequestHandler):
    def do_DELETE(self):
        try:
            # Get firebase_uid from path
            path_parts = self.path.split('/')
            firebase_uid = path_parts[-1] if len(path_parts) > 0 else None
            
            if not firebase_uid:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "firebase_uid required"}).encode())
                return
            
            # Delete user from users collection
            users_result = db.users.delete_one({"firebase_uid": firebase_uid})
            
            # Delete all user data from other collections
            db.conversations.delete_many({"$or": [{"user_id": firebase_uid}, {"firebase_uid": firebase_uid}]})
            db.sessions.delete_many({"$or": [{"user_id": firebase_uid}, {"firebase_uid": firebase_uid}]})
            db.journal_entries.delete_many({"$or": [{"user_id": firebase_uid}, {"firebase_uid": firebase_uid}]})
            db.mood_logs.delete_many({"$or": [{"user_id": firebase_uid}, {"firebase_uid": firebase_uid}]})
            db.risk_events.delete_many({"$or": [{"user_id": firebase_uid}, {"firebase_uid": firebase_uid}]})
            db.subscriptions.delete_many({"$or": [{"user_id": firebase_uid}, {"firebase_uid": firebase_uid}]})
            
            if users_result.deleted_count == 0:
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "User not found"}).encode())
                return
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': 'User deleted successfully'
            }).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
