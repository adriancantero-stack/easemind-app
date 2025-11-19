from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Import here to avoid issues if not installed
            import firebase_admin
            from firebase_admin import credentials, auth as firebase_auth
            from pymongo import MongoClient
            
            # Get MongoDB connection
            MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
            client = MongoClient(MONGO_URL)
            db = client['easemind']
            
            # Initialize Firebase Admin if not already done
            try:
                firebase_admin.get_app()
            except ValueError:
                # Get credentials from environment variable
                creds_json = os.environ.get('FIREBASE_ADMIN_SDK')
                if not creds_json:
                    self.send_response(500)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "error": "FIREBASE_ADMIN_SDK not configured"
                    }).encode())
                    return
                
                cred_dict = json.loads(creds_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
            
            # List all users from Firebase
            page = firebase_auth.list_users()
            users_synced = 0
            users_created = 0
            users_updated = 0
            
            while page:
                for firebase_user in page.users:
                    # Sync each user to MongoDB
                    user_data = {
                        "firebase_uid": firebase_user.uid,
                        "email": firebase_user.email or '',
                        "display_name": firebase_user.display_name or 'Usuário',
                        "photo_url": firebase_user.photo_url,
                    }
                    
                    # Add timestamps if available
                    if firebase_user.user_metadata.creation_timestamp:
                        user_data["created_at"] = firebase_user.user_metadata.creation_timestamp / 1000
                    if firebase_user.user_metadata.last_sign_in_timestamp:
                        user_data["last_login"] = firebase_user.user_metadata.last_sign_in_timestamp / 1000
                    
                    # Upsert to MongoDB
                    result = db.users.update_one(
                        {"firebase_uid": firebase_user.uid},
                        {"$set": user_data},
                        upsert=True
                    )
                    
                    if result.upserted_id:
                        users_created += 1
                    elif result.modified_count > 0:
                        users_updated += 1
                    
                    users_synced += 1
                
                # Get next page
                page = page.get_next_page()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'synced': users_synced,
                'created': users_created,
                'updated': users_updated
            }).encode())
            
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
