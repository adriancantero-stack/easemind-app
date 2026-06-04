from http.server import BaseHTTPRequestHandler
import json
import os
from pymongo import MongoClient

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client['easemind']

sessions_completed_collection = db['sessions_completed']

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            pipeline = [
                {"$match": {"completed": True}},
                {"$group": {
                    "_id": "$session_id",
                    "completions": {"$sum": 1},
                    "avg_duration": {"$avg": "$duration_seconds"}
                }},
                {"$sort": {"completions": -1}},
                {"$limit": 10}
            ]
            
            results = list(sessions_completed_collection.aggregate(pipeline))
            
            sessions = [{
                "session_id": r["_id"],
                "completions": r["completions"],
                "avg_duration_minutes": round(r["avg_duration"] / 60, 1) if r.get("avg_duration") else 0
            } for r in results]
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"sessions": sessions}).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
