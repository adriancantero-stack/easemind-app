from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs
from pymongo import MongoClient
from datetime import datetime, timedelta

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
DB_NAME = os.environ.get('DB_NAME', 'railway')
db = client[DB_NAME]

# Collections
users_collection = db['users']
conversations_collection = db['conversations']
sessions_completed_collection = db['sessions_completed']
journal_entries_collection = db['journal_entries']
risk_events_collection = db['risk_events']
mood_logs_collection = db['mood_logs']

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Total de usuários
            total_users = users_collection.count_documents({})
            
            # Usuários ativos (últimos 7 dias)
            seven_days_ago = datetime.utcnow() - timedelta(days=7)
            active_users_7d = conversations_collection.distinct("user_id", {
                "created_at": {"$gte": seven_days_ago}
            })
            
            # Total de conversas
            total_conversations = conversations_collection.count_documents({})
            
            # Total de sessões guiadas
            total_sessions = sessions_completed_collection.count_documents({"completed": True})
            
            # Total de entradas de diário
            total_journal_entries = journal_entries_collection.count_documents({})
            
            # Eventos de risco (últimos 30 dias)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            risk_events_30d = risk_events_collection.count_documents({
                "created_at": {"$gte": thirty_days_ago}
            })
            
            # Distribuição de humor médio
            mood_pipeline = [
                {"$group": {
                    "_id": None,
                    "avg_mood": {"$avg": "$mood_value"},
                    "total_logs": {"$sum": 1}
                }}
            ]
            mood_result = list(mood_logs_collection.aggregate(mood_pipeline))
            avg_mood = mood_result[0]["avg_mood"] if mood_result else 0
            
            stats = {
                "users": {
                    "total": total_users,
                    "active_7d": len(active_users_7d),
                    "retention_rate": round(len(active_users_7d) / total_users * 100, 1) if total_users > 0 else 0
                },
                "engagement": {
                    "total_conversations": total_conversations,
                    "total_sessions": total_sessions,
                    "total_journal_entries": total_journal_entries,
                    "avg_conversations_per_user": round(total_conversations / total_users, 1) if total_users > 0 else 0
                },
                "wellbeing": {
                    "avg_mood": round(avg_mood, 1),
                    "risk_events_30d": risk_events_30d
                }
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"stats": stats}).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
