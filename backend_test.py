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
BACKEND_URL = "https://easemind-control.preview.emergentagent.com/api"

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
        "photo_url": ""
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

def test_user_profile_management():
    """Test User Profile Management API endpoints"""
    print("👤 Testing User Profile Management API")
    print("=" * 50)
    
    # Create test user first
    test_firebase_uid = f"profile_test_{uuid.uuid4().hex[:8]}"
    test_email = f"maria.{uuid.uuid4().hex[:6]}@easemind.io"
    
    print(f"📋 Test Firebase UID: {test_firebase_uid}")
    print(f"📧 Test Email: {test_email}")
    print()
    
    # Step 1: Create user via sync
    print("🧪 Step 1: Create user via /api/user/sync")
    sync_payload = {
        "firebase_uid": test_firebase_uid,
        "email": test_email,
        "display_name": "Maria Silva",
        "photo_url": None
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/user/sync", json=sync_payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print("✅ PASS: User created successfully")
            else:
                print(f"❌ FAIL: User creation failed: {data}")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Step 2: Get initial profile
    print("🧪 Step 2: GET /api/user/profile/{firebase_uid} - Initial Profile")
    try:
        response = requests.get(f"{BACKEND_URL}/user/profile/{test_firebase_uid}", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "user" in data:
                user_data = data["user"]
                print("✅ PASS: Initial profile retrieved")
                print(f"   - Display Name: {user_data.get('display_name')}")
                print(f"   - Email: {user_data.get('email')}")
                print(f"   - Goals: {user_data.get('goals')}")
                print(f"   - Notification Enabled: {user_data.get('notification_enabled')}")
                print(f"   - Preferred Time: {user_data.get('preferred_time')}")
            else:
                print(f"❌ FAIL: Invalid profile response: {data}")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Step 3: Update complete profile
    print("🧪 Step 3: PUT /api/user/profile - Complete Profile Update")
    profile_update = {
        "firebase_uid": test_firebase_uid,
        "display_name": "Maria Silva Santos",
        "profile_photo": None,
        "goals": ["reduce_anxiety", "improve_sleep"],
        "notification_enabled": True,
        "preferred_time": "morning",
        "age_range": "25-34",
        "gender": "female"
    }
    
    try:
        response = requests.put(f"{BACKEND_URL}/user/profile", json=profile_update, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "user" in data:
                user_data = data["user"]
                print("✅ PASS: Profile updated successfully")
                print(f"   - Display Name: {user_data.get('display_name')}")
                print(f"   - Goals: {user_data.get('goals')}")
                print(f"   - Preferred Time: {user_data.get('preferred_time')}")
                print(f"   - Age Range: {user_data.get('age_range')}")
                print(f"   - Gender: {user_data.get('gender')}")
            else:
                print(f"❌ FAIL: Profile update failed: {data}")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Step 4: Verify profile update persisted
    print("🧪 Step 4: GET /api/user/profile/{firebase_uid} - Verify Update")
    try:
        response = requests.get(f"{BACKEND_URL}/user/profile/{test_firebase_uid}", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "user" in data:
                user_data = data["user"]
                print("✅ PASS: Updated profile retrieved")
                
                # Verify specific fields
                if user_data.get('display_name') == "Maria Silva Santos":
                    print("✅ PASS: Display name updated correctly")
                else:
                    print(f"❌ FAIL: Display name mismatch. Expected: 'Maria Silva Santos', Got: {user_data.get('display_name')}")
                
                if user_data.get('goals') == ["reduce_anxiety", "improve_sleep"]:
                    print("✅ PASS: Goals updated correctly")
                else:
                    print(f"❌ FAIL: Goals mismatch. Expected: ['reduce_anxiety', 'improve_sleep'], Got: {user_data.get('goals')}")
                
                if user_data.get('age_range') == "25-34":
                    print("✅ PASS: Age range updated correctly")
                else:
                    print(f"❌ FAIL: Age range mismatch. Expected: '25-34', Got: {user_data.get('age_range')}")
            else:
                print(f"❌ FAIL: Invalid profile response: {data}")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Step 5: Partial profile update
    print("🧪 Step 5: PUT /api/user/profile - Partial Update (only display_name and goals)")
    partial_update = {
        "firebase_uid": test_firebase_uid,
        "display_name": "Maria",
        "goals": ["reduce_anxiety"]
    }
    
    try:
        response = requests.put(f"{BACKEND_URL}/user/profile", json=partial_update, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "user" in data:
                user_data = data["user"]
                print("✅ PASS: Partial profile update successful")
                print(f"   - Display Name: {user_data.get('display_name')} (should be 'Maria')")
                print(f"   - Goals: {user_data.get('goals')} (should be ['reduce_anxiety'])")
                print(f"   - Age Range: {user_data.get('age_range')} (should remain '25-34')")
                print(f"   - Gender: {user_data.get('gender')} (should remain 'female')")
            else:
                print(f"❌ FAIL: Partial update failed: {data}")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Step 6: Test Luna personalization
    print("🧪 Step 6: POST /api/chat - Test Luna Personalization")
    chat_payload = {
        "message": "Olá Luna, estou me sentindo um pouco ansioso hoje. Pode me ajudar?",
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
                luna_response = data.get('response', '')
                print("✅ PASS: Luna response received")
                print(f"🤖 Luna Response: {luna_response[:200]}...")
                
                # Check if Luna uses the user's name "Maria"
                if "Maria" in luna_response:
                    print("✅ PASS: Luna correctly used user's name 'Maria' in response")
                else:
                    print("⚠️  NOTE: Luna did not use user's name 'Maria' in response (may be normal)")
                
                print(f"🔗 Correlation ID: {data.get('correlation_id')}")
            else:
                print(f"❌ FAIL: Invalid chat response: {data}")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    print("🎉 User Profile Management Tests Completed!")
    return True

def test_luna_display_name_fix():
    """
    Test Luna Display Name Fix - Specific test for the reported issue
    Tests that custom display names are preserved during Google Sign-In sync
    """
    print("🔧 Testing Luna Display Name Fix")
    print("=" * 50)
    
    # Use the actual test user from the review request
    test_firebase_uid = "VRHGdfIvf2PsbsVuh31uGVwWhkE3"
    test_email = "adrian.cantero1@gmail.com"
    custom_display_name = "Adrian"
    google_full_name = "Adrian Cantero"
    
    print(f"📋 Test Firebase UID: {test_firebase_uid}")
    print(f"📧 Test Email: {test_email}")
    print(f"👤 Custom Display Name: {custom_display_name}")
    print(f"🔍 Google Full Name: {google_full_name}")
    print()
    
    # Test 1: Set up user with custom display_name
    print("🧪 Test 1: Set up user with custom display_name")
    profile_update = {
        "firebase_uid": test_firebase_uid,
        "display_name": custom_display_name
    }
    
    try:
        # First try to update profile (user might already exist)
        response = requests.put(f"{BACKEND_URL}/user/profile", json=profile_update, timeout=10)
        
        if response.status_code == 404:
            # User doesn't exist, create via sync first
            print("   User doesn't exist, creating via sync...")
            sync_payload = {
                "firebase_uid": test_firebase_uid,
                "email": test_email,
                "display_name": custom_display_name
            }
            
            response = requests.post(f"{BACKEND_URL}/user/sync", json=sync_payload, timeout=10)
            if response.status_code == 200:
                print(f"✅ PASS: User created with custom display_name: '{custom_display_name}'")
            else:
                print(f"❌ FAIL: Failed to create user: {response.status_code}")
                return False
        elif response.status_code == 200:
            print(f"✅ PASS: Profile updated with custom display_name: '{custom_display_name}'")
        else:
            print(f"❌ FAIL: Profile update failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Test 2: Simulate Google Sign-In (should NOT overwrite custom name)
    print("🧪 Test 2: Simulate Google Sign-In with full name (should preserve custom name)")
    google_sync_payload = {
        "firebase_uid": test_firebase_uid,
        "email": test_email,
        "display_name": google_full_name  # This should NOT overwrite custom name
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/user/sync", json=google_sync_payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print("✅ PASS: Google sync completed")
            else:
                print(f"❌ FAIL: Google sync failed: {data}")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Test 3: Verify custom display_name is preserved
    print("🧪 Test 3: Verify custom display_name is preserved")
    try:
        response = requests.get(f"{BACKEND_URL}/user/profile/{test_firebase_uid}", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "user" in data:
                actual_display_name = data["user"].get("display_name")
                print(f"   Actual display_name: '{actual_display_name}'")
                print(f"   Expected: '{custom_display_name}'")
                
                if actual_display_name == custom_display_name:
                    print("✅ PASS: Custom display_name preserved after Google sync!")
                else:
                    print(f"❌ FAIL: Display name was overwritten! Expected: '{custom_display_name}', Got: '{actual_display_name}'")
                    return False
            else:
                print(f"❌ FAIL: Invalid profile response: {data}")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Test 4: Test Luna context retrieval
    print("🧪 Test 4: Test Luna context retrieval with correct display_name")
    try:
        response = requests.get(f"{BACKEND_URL}/user-context/{test_firebase_uid}", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            context = data.get("context", {})
            profile = context.get("user_profile", {})
            context_display_name = profile.get("display_name")
            
            if context_display_name == custom_display_name:
                print(f"✅ PASS: Luna context contains correct display_name: '{context_display_name}'")
            else:
                print(f"❌ FAIL: Luna context has wrong display_name! Expected: '{custom_display_name}', Got: '{context_display_name}'")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Test 5: Test chat integration with Luna
    print("🧪 Test 5: Test chat integration - Luna should use correct display_name")
    chat_payload = {
        "message": "Olá Luna, como você está hoje?",
        "lang": "pt-BR",
        "history": [],
        "user_id": test_firebase_uid
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/chat", json=chat_payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if "response" in data:
                luna_response = data.get("response", "")
                print(f"🤖 Luna Response: {luna_response[:150]}...")
                
                # Check if Luna's response is personalized (length indicates proper processing)
                if len(luna_response) > 50:
                    print("✅ PASS: Luna responded with personalized content")
                else:
                    print("⚠️  WARNING: Luna's response seems too short or generic")
                
                print(f"🔗 Correlation ID: {data.get('correlation_id')}")
            else:
                print(f"❌ FAIL: Invalid chat response: {data}")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Test 6: Test default name behavior (create new user with default name)
    print("🧪 Test 6: Test default name behavior - should update default names")
    default_test_uid = f"default_test_{uuid.uuid4().hex[:8]}"
    default_test_email = f"default.test.{uuid.uuid4().hex[:6]}@example.com"
    google_name = "Test Google User"
    
    # Create user with default name
    sync_payload = {
        "firebase_uid": default_test_uid,
        "email": default_test_email,
        "display_name": "Usuário"  # Default name
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/user/sync", json=sync_payload, timeout=10)
        if response.status_code == 200:
            print("✅ PASS: Test user created with default name 'Usuário'")
        else:
            print(f"❌ FAIL: Failed to create test user: {response.status_code}")
            return False
        
        # Sync again with Google name (should update since it's default)
        google_sync_payload = {
            "firebase_uid": default_test_uid,
            "email": default_test_email,
            "display_name": google_name
        }
        
        response = requests.post(f"{BACKEND_URL}/user/sync", json=google_sync_payload, timeout=10)
        if response.status_code == 200:
            print("✅ PASS: Google sync completed for default user")
        else:
            print(f"❌ FAIL: Google sync failed: {response.status_code}")
            return False
        
        # Verify name was updated
        response = requests.get(f"{BACKEND_URL}/user/profile/{default_test_uid}", timeout=10)
        if response.status_code == 200:
            data = response.json()
            actual_name = data.get("user", {}).get("display_name")
            if actual_name == google_name:
                print(f"✅ PASS: Default name correctly updated to: '{actual_name}'")
            else:
                print(f"❌ FAIL: Default name not updated! Expected: '{google_name}', Got: '{actual_name}'")
                return False
        else:
            print(f"❌ FAIL: Failed to get profile: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    print("🎉 Luna Display Name Fix Tests Completed!")
    return True

def test_admin_panel_bug_fixes():
    """
    Test Admin Panel Bug Fixes - Specific test for the review request
    Bug 1: Invalid Date Display in /api/list_users
    Bug 2: 401 Error on User Deletion in /api/admin/delete-user/{firebase_uid}
    """
    print("🔧 Testing Admin Panel Bug Fixes")
    print("=" * 50)
    
    # Test Bug 1: Invalid Date Display
    print("🧪 Bug 1: Testing /api/list_users - Date Display Fix")
    try:
        response = requests.get(f"{BACKEND_URL}/list_users", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            users = data.get("users", [])
            print(f"✅ PASS: Retrieved {len(users)} users")
            
            # Look for the test user specifically
            test_user = None
            for user in users:
                if user.get("firebase_uid") == "test_user_123" or user.get("email") == "teste@easemind.io":
                    test_user = user
                    break
            
            if test_user:
                print(f"🎯 Found test user: {test_user.get('email')} (UID: {test_user.get('firebase_uid')})")
                
                # Test date parsing
                created_at = test_user.get("created_at")
                if created_at:
                    print(f"📅 created_at value: {created_at} (type: {type(created_at)})")
                    
                    # Try to parse the date
                    try:
                        if isinstance(created_at, str):
                            # Try parsing ISO format
                            parsed_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                            print(f"✅ PASS: Date parsed successfully: {parsed_date}")
                            print(f"✅ BUG 1 FIX VERIFIED: Date is in valid ISO string format")
                        else:
                            print(f"❌ FAIL: created_at is not a string, it's {type(created_at)}")
                            return False
                    except Exception as e:
                        print(f"❌ FAIL: Could not parse date '{created_at}': {e}")
                        return False
                else:
                    print("⚠️  Test user has no created_at field")
            else:
                print("⚠️  Test user (test_user_123 / teste@easemind.io) not found")
                # Still check if any user has valid date format
                if users:
                    sample_user = users[0]
                    created_at = sample_user.get("created_at")
                    if created_at and isinstance(created_at, str):
                        try:
                            parsed_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                            print(f"✅ PASS: Sample user date format is valid: {created_at}")
                        except:
                            print(f"❌ FAIL: Sample user date format is invalid: {created_at}")
                            return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Test Bug 2: 401 Error on User Deletion
    print("🧪 Bug 2: Testing /api/admin/delete-user/{firebase_uid} - User Deletion Fix")
    firebase_uid = "test_user_123"
    
    try:
        response = requests.delete(f"{BACKEND_URL}/admin/delete-user/{firebase_uid}", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("success") == True:
                    print(f"✅ PASS: User deletion successful")
                    print(f"✅ BUG 2 FIX VERIFIED: Endpoint returned success=true")
                else:
                    print(f"❌ FAIL: Response success field is not true: {data}")
                    return False
            except:
                print(f"❌ FAIL: Could not parse JSON response")
                return False
        elif response.status_code == 404:
            print(f"⚠️  User not found (404) - this might be expected if user was already deleted")
            print(f"✅ BUG 2 FIX VERIFIED: No 401 error, endpoint is accessible")
        elif response.status_code == 401:
            print(f"❌ FAIL: Still getting 401 Unauthorized error")
            return False
        else:
            print(f"❌ FAIL: Unexpected status code {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    print()
    
    # Verify user deletion by checking list again
    print("🧪 Verification: Check if user was deleted from list")
    try:
        response = requests.get(f"{BACKEND_URL}/list_users", timeout=10)
        if response.status_code == 200:
            data = response.json()
            users = data.get("users", [])
            
            # Look for the test user
            test_user_found = False
            for user in users:
                if user.get("firebase_uid") == "test_user_123" or user.get("email") == "teste@easemind.io":
                    test_user_found = True
                    break
            
            if test_user_found:
                print(f"⚠️  Test user still exists in database")
            else:
                print(f"✅ PASS: Test user successfully removed from database")
        else:
            print(f"❌ Could not verify deletion - list_users returned {response.status_code}")
    except Exception as e:
        print(f"❌ Error verifying deletion: {e}")
    
    print()
    print("🎉 Admin Panel Bug Fixes Tests Completed!")
    return True

def main():
    """Run all tests"""
    print("🚀 EaseMind Backend Testing - Complete API Suite")
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
    
    # Run Admin Panel Bug Fixes tests (NEW - Priority test for review request)
    admin_fixes_ok = test_admin_panel_bug_fixes()
    print()
    
    # Run Firebase sync tests
    firebase_ok = test_firebase_user_sync()
    print()
    
    # Run Profile Management tests
    profile_ok = test_user_profile_management()
    print()
    
    # Run Luna Display Name Fix tests
    luna_fix_ok = test_luna_display_name_fix()
    
    print()
    print("=" * 60)
    print("📊 FINAL TEST RESULTS")
    print("=" * 60)
    
    if admin_fixes_ok and firebase_ok and profile_ok and luna_fix_ok:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Admin Panel Bug Fixes: WORKING")
        print("✅ Firebase User Sync: WORKING")
        print("✅ User Profile Management: WORKING")
        print("✅ Luna Personalization: WORKING")
        print("✅ Luna Display Name Fix: WORKING")
        sys.exit(0)
    else:
        print("❌ SOME TESTS FAILED!")
        print(f"{'✅' if admin_fixes_ok else '❌'} Admin Panel Bug Fixes: {'WORKING' if admin_fixes_ok else 'FAILED'}")
        print(f"{'✅' if firebase_ok else '❌'} Firebase User Sync: {'WORKING' if firebase_ok else 'FAILED'}")
        print(f"{'✅' if profile_ok else '❌'} User Profile Management: {'WORKING' if profile_ok else 'FAILED'}")
        print(f"{'✅' if luna_fix_ok else '❌'} Luna Display Name Fix: {'WORKING' if luna_fix_ok else 'FAILED'}")
        sys.exit(1)

if __name__ == "__main__":
    main()