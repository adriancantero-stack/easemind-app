#!/usr/bin/env python3
"""
Test Luna Context Injection - Verify Luna uses user profile data
"""

import requests
import json
import uuid

BACKEND_URL = "https://speech-chat-app.preview.emergentagent.com/api"

def test_luna_context_injection():
    """Test that Luna receives and uses user context properly"""
    print("🤖 Testing Luna Context Injection")
    print("=" * 50)
    
    # Create a user with specific profile
    test_firebase_uid = f"luna_test_{uuid.uuid4().hex[:8]}"
    
    # Step 1: Create user
    sync_data = {
        "firebase_uid": test_firebase_uid,
        "email": f"{test_firebase_uid}@test.com",
        "display_name": "João Silva"
    }
    
    response = requests.post(f"{BACKEND_URL}/user/sync", json=sync_data)
    print(f"User creation: {response.status_code}")
    
    # Step 2: Update profile with specific goals
    profile_data = {
        "firebase_uid": test_firebase_uid,
        "display_name": "João Silva",
        "goals": ["reduce_anxiety", "improve_sleep"],
        "preferred_time": "evening"
    }
    
    response = requests.put(f"{BACKEND_URL}/user/profile", json=profile_data)
    print(f"Profile update: {response.status_code}")
    
    # Step 3: Check user context
    response = requests.get(f"{BACKEND_URL}/user-context/{test_firebase_uid}")
    if response.status_code == 200:
        context = response.json()["context"]
        print(f"✅ User context retrieved:")
        print(f"   - Name: {context['user_profile']['display_name']}")
        print(f"   - Goals: {context['user_profile']['goals']}")
        print(f"   - Preferred Time: {context['user_profile']['preferred_time']}")
    
    # Step 4: Test Luna with anxiety-related message
    chat_data = {
        "message": "Estou com muita ansiedade e não consigo dormir bem. Pode me ajudar?",
        "lang": "pt-BR",
        "user_id": test_firebase_uid
    }
    
    response = requests.post(f"{BACKEND_URL}/chat", json=chat_data)
    if response.status_code == 200:
        data = response.json()
        luna_response = data["response"]
        
        print(f"\n🤖 Luna Response:")
        print(f"{luna_response}")
        
        # Check if Luna addresses the user by name
        if "João" in luna_response:
            print(f"\n✅ Luna used user's name 'João'")
        else:
            print(f"\n⚠️ Luna did not use user's name 'João'")
        
        # Check if Luna addresses anxiety (user's goal)
        if "ansiedade" in luna_response.lower():
            print(f"✅ Luna addressed anxiety (user's goal)")
        else:
            print(f"⚠️ Luna did not specifically address anxiety")
        
        # Check if Luna addresses sleep (user's goal)
        if "sono" in luna_response.lower() or "dormir" in luna_response.lower():
            print(f"✅ Luna addressed sleep issues (user's goal)")
        else:
            print(f"⚠️ Luna did not specifically address sleep")
    
    print(f"\n🎉 Luna context test completed!")

if __name__ == "__main__":
    test_luna_context_injection()