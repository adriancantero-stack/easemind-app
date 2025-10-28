#!/usr/bin/env python3
"""
EaseMind Backend Testing - Firebase User Sync
Tests the new Firebase UID synchronization endpoints
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Get backend URL from environment
BACKEND_URL = "https://calmspace-38.preview.emergentagent.com/api"

print(f"🌐 Testing Backend URL: {BACKEND_URL}")
print(f"⏰ Test Time: {datetime.now().isoformat()}")
print()

def test_firebase_user_sync():
    """Test Firebase User Sync endpoint functionality"""
    print("🔥 Testing Firebase User Sync Endpoints")
    print("=" * 50)
    
    # Test data
    test_firebase_uid = f"test_firebase_uid_{uuid.uuid4().hex[:8]}"
    test_email = f"test.user.{uuid.uuid4().hex[:6]}@easemind.io"
    test_display_name = "Test User Firebase"
    
    print(f"📋 Test Firebase UID: {test_firebase_uid}")
    print(f"📧 Test Email: {test_email}")
    print()
    
    # Test 1: Create new Firebase user
    print("🧪 Test 1: POST /api/user/sync - Create New User")
    sync_payload = {
        "firebase_uid": test_firebase_uid,
        "email": test_email,
        "display_name": test_display_name,
        "photo_url": None
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/user/sync", json=sync_payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            if data.get("success") and data.get("is_new_user") == True:
                print("✅ PASS: New user created successfully")
                user_id = data.get("user_id")
                if user_id == test_firebase_uid:
                    print("✅ PASS: User ID matches Firebase UID")
                else:
                    print(f"❌ FAIL: User ID mismatch. Expected: {test_firebase_uid}, Got: {user_id}")
            else:
                print(f"❌ FAIL: Unexpected response structure: {data}")
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Test 2: Update existing Firebase user
    print("🧪 Test 2: POST /api/user/sync - Update Existing User")
    update_payload = {
        "firebase_uid": test_firebase_uid,
        "email": test_email,
        "display_name": "Updated Test User",
        "photo_url": "https://example.com/photo.jpg"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/user/sync", json=update_payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data.get("is_new_user") == False:
                print("✅ PASS: Existing user updated successfully")
            else:
                print(f"❌ FAIL: Expected is_new_user=false, got: {data}")
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Test 3: Get user context with Firebase UID
    print("🧪 Test 3: GET /api/user-context/{firebase_uid}")
    try:
        response = requests.get(f"{BACKEND_URL}/user-context/{test_firebase_uid}", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("user_id") == test_firebase_uid and "context" in data:
                print("✅ PASS: User context retrieved successfully")
            else:
                print(f"❌ FAIL: Invalid context response: {data}")
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Test 4: Create journal entry with Firebase UID
    print("🧪 Test 4: POST /api/journal - Create Journal Entry with Firebase UID")
    journal_payload = {
        "user_id": test_firebase_uid,
        "title": "Test Entry Firebase Sync",
        "content": "Testing journal with Firebase UID synchronization. This is a test entry to verify the integration works properly.",
        "mood": 4,
        "tags": ["test", "firebase", "sync"],
        "date": "2025-06-15T10:00:00Z"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/journal", json=journal_payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "entry_id" in data:
                print("✅ PASS: Journal entry created successfully")
                entry_id = data.get("entry_id")
                print(f"📝 Entry ID: {entry_id}")
            else:
                print(f"❌ FAIL: Invalid journal response: {data}")
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Test 5: Retrieve journal entries with Firebase UID
    print("🧪 Test 5: GET /api/journal/{firebase_uid} - Retrieve Journal Entries")
    try:
        response = requests.get(f"{BACKEND_URL}/journal/{test_firebase_uid}", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("user_id") == test_firebase_uid and "entries" in data:
                entries = data.get("entries", [])
                if len(entries) > 0:
                    print(f"✅ PASS: Retrieved {len(entries)} journal entries")
                    # Check if our test entry is there
                    test_entry_found = any(entry.get("title") == "Test Entry Firebase Sync" for entry in entries)
                    if test_entry_found:
                        print("✅ PASS: Test journal entry found in results")
                    else:
                        print("⚠️  WARNING: Test journal entry not found in results")
                else:
                    print("⚠️  WARNING: No journal entries found")
            else:
                print(f"❌ FAIL: Invalid journal retrieval response: {data}")
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Test 6: Test chat endpoint with Firebase UID
    print("🧪 Test 6: POST /api/chat - Chat with Firebase UID Context")
    chat_payload = {
        "message": "Olá Luna, como você está hoje? Estou testando a integração com Firebase.",
        "lang": "pt-BR",
        "history": [],
        "user_id": test_firebase_uid
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/chat", json=chat_payload, timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if "response" in data and "correlation_id" in data:
                print("✅ PASS: Chat response received successfully")
                print(f"🤖 Luna Response: {data.get('response')[:100]}...")
                print(f"🔗 Correlation ID: {data.get('correlation_id')}")
            else:
                print(f"❌ FAIL: Invalid chat response: {data}")
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    print("🎉 Firebase User Sync Tests Completed!")
    return True

def test_health_check():
    """Test basic health check endpoint"""
    print("🏥 Testing Health Check")
    print("=" * 30)
    
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "ok":
                print("✅ PASS: Health check successful")
                return True
            else:
                print(f"❌ FAIL: Health check failed: {data}")
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    return False

def main():
    """Run all tests"""
    print("🚀 EaseMind Backend Testing - Firebase User Sync")
    print("=" * 60)
    print(f"🌐 Backend URL: {BACKEND_URL}")
    print(f"⏰ Test Time: {datetime.now().isoformat()}")
    print()
    
    # Test health first
    health_ok = test_health_check()
    print()
    
    if not health_ok:
        print("❌ Health check failed. Stopping tests.")
        sys.exit(1)
    
    # Run Firebase sync tests
    firebase_ok = test_firebase_user_sync()
    
    print()
    print("=" * 60)
    if firebase_ok:
        print("🎉 ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print("❌ SOME TESTS FAILED!")
        sys.exit(1)

if __name__ == "__main__":
    main()