from http.server import BaseHTTPRequestHandler
import json
import os
from pymongo import MongoClient

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
DB_NAME = os.environ.get('DB_NAME', 'railway')
db = client[DB_NAME]

mood_logs_collection = db['mood_logs']

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            pipeline = [
                {"$group": {
                    "_id": "$mood_value",
                    "count": {"$sum": 1}
                }},
                {"$sort": {"_id": 1}}
            ]
            
            results = list(mood_logs_collection.aggregate(pipeline))
            distribution = {str(r["_id"]): r["count"] for r in results}
            
            response_data = {
                "distribution": distribution,
                "total_logs": sum(distribution.values())
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
