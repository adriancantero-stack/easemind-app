#!/usr/bin/env python3
"""
EaseMind Unified Proxy Server & Backend API Testing Suite
Tests the unified proxy server routing and backend API endpoints
"""

import requests
import json
import sys
import os
import time
from typing import Dict, Any

# Test configuration - Testing the unified proxy server
PROXY_URL = "http://localhost:8080"
BACKEND_URL = "http://localhost:8001"
WEBSITE_URL = "http://localhost:9000"
FRONTEND_URL = "http://localhost:3000"

print(f"Testing unified proxy server at: {PROXY_URL}")
print(f"Backend direct: {BACKEND_URL}")
print(f"Website direct: {WEBSITE_URL}")
print(f"Frontend direct: {FRONTEND_URL}")

class UnifiedProxyTester:
    def __init__(self):
        self.results = []
        self.passed = 0
        self.failed = 0
    
    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details
        }
        self.results.append(result)
        
        if success:
            self.passed += 1
        else:
            self.failed += 1
        
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    def test_services_running(self):
        """Test if all individual services are running"""
        print("\n🔍 Testing Individual Services...")
        
        # Test Backend Direct
        try:
            response = requests.get(f"{BACKEND_URL}/api/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.log_result("Backend Service (Direct)", True, f"Status: {data.get('status', 'unknown')}")
            else:
                self.log_result("Backend Service (Direct)", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("Backend Service (Direct)", False, f"Connection error: {str(e)}")
        
        # Test Website Direct
        try:
            response = requests.get(f"{WEBSITE_URL}/", timeout=5)
            if response.status_code == 200:
                self.log_result("Website Service (Direct)", True, f"HTTP {response.status_code}")
            else:
                self.log_result("Website Service (Direct)", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("Website Service (Direct)", False, f"Connection error: {str(e)}")
        
        # Test Frontend Direct
        try:
            response = requests.get(f"{FRONTEND_URL}/", timeout=5)
            if response.status_code == 200:
                self.log_result("Frontend Service (Direct)", True, f"HTTP {response.status_code}")
            else:
                self.log_result("Frontend Service (Direct)", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("Frontend Service (Direct)", False, f"Connection error: {str(e)}")
    
    def test_proxy_backend_routing(self):
        """Test proxy routing to backend (/api/*)"""
        print("\n🔀 Testing Proxy → Backend Routing...")
        
        # Test /api/health through proxy
        try:
            response = requests.get(f"{PROXY_URL}/api/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'ok':
                    self.log_result("Proxy → Backend (/api/health)", True, f"Routed successfully, status: {data.get('status')}")
                else:
                    self.log_result("Proxy → Backend (/api/health)", False, f"Invalid response: {data}")
            else:
                self.log_result("Proxy → Backend (/api/health)", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("Proxy → Backend (/api/health)", False, f"Connection error: {str(e)}")
        
        # Test /api/version through proxy
        try:
            response = requests.get(f"{PROXY_URL}/api/version", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "version" in data and "endpoints" in data:
                    self.log_result("Proxy → Backend (/api/version)", True, f"Version: {data.get('version')}")
                else:
                    self.log_result("Proxy → Backend (/api/version)", False, f"Invalid response structure")
            else:
                self.log_result("Proxy → Backend (/api/version)", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("Proxy → Backend (/api/version)", False, f"Error: {str(e)}")
    
    def test_proxy_website_routing(self):
        """Test proxy routing to website (/)"""
        print("\n🌐 Testing Proxy → Website Routing...")
        
        # Test root path
        try:
            response = requests.get(f"{PROXY_URL}/", timeout=10)
            if response.status_code == 200:
                content = response.text
                if "EaseMind" in content and "html" in content.lower():
                    self.log_result("Proxy → Website (/)", True, f"Website content loaded successfully")
                else:
                    self.log_result("Proxy → Website (/)", False, f"Invalid content received")
            else:
                self.log_result("Proxy → Website (/)", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("Proxy → Website (/)", False, f"Connection error: {str(e)}")
        
        # Test website pages
        pages = ["/how-it-works", "/plans", "/contact"]
        for page in pages:
            try:
                response = requests.get(f"{PROXY_URL}{page}", timeout=10)
                if response.status_code == 200:
                    content = response.text
                    if "EaseMind" in content and "html" in content.lower():
                        self.log_result(f"Proxy → Website ({page})", True, f"Page loaded successfully")
                    else:
                        self.log_result(f"Proxy → Website ({page})", False, f"Invalid content")
                else:
                    self.log_result(f"Proxy → Website ({page})", False, f"HTTP {response.status_code}")
            except Exception as e:
                self.log_result(f"Proxy → Website ({page})", False, f"Error: {str(e)}")
    
    def test_proxy_frontend_routing(self):
        """Test proxy routing to frontend (/app)"""
        print("\n📱 Testing Proxy → Frontend Routing...")
        
        # Test /app route
        try:
            response = requests.get(f"{PROXY_URL}/app", timeout=10)
            if response.status_code == 200:
                self.log_result("Proxy → Frontend (/app)", True, f"Frontend routed successfully")
            else:
                self.log_result("Proxy → Frontend (/app)", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("Proxy → Frontend (/app)", False, f"Connection error: {str(e)}")
        
        # Test /app/ route
        try:
            response = requests.get(f"{PROXY_URL}/app/", timeout=10)
            if response.status_code == 200:
                self.log_result("Proxy → Frontend (/app/)", True, f"Frontend routed successfully")
            else:
                self.log_result("Proxy → Frontend (/app/)", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("Proxy → Frontend (/app/)", False, f"Connection error: {str(e)}")
    
    def test_backend_api_functionality(self):
        """Test backend API functionality through proxy"""
        print("\n🔧 Testing Backend API Functionality...")
        
        # Test chat endpoint with sample message
        try:
            chat_data = {
                "message": "Hello, I'm feeling anxious today. Can you help me?",
                "lang": "en",
                "user_id": "test_user_proxy_123"
            }
            response = requests.post(f"{PROXY_URL}/api/chat", 
                                   json=chat_data, 
                                   timeout=30,
                                   headers={"Content-Type": "application/json"})
            
            if response.status_code == 200:
                data = response.json()
                if "response" in data and "correlation_id" in data:
                    self.log_result("Backend Chat API (via Proxy)", True, f"Chat response received (ID: {data.get('correlation_id', 'N/A')[:8]}...)")
                else:
                    self.log_result("Backend Chat API (via Proxy)", False, f"Invalid response structure: {data}")
            else:
                self.log_result("Backend Chat API (via Proxy)", False, f"HTTP {response.status_code}: {response.text[:100]}")
        except Exception as e:
            self.log_result("Backend Chat API (via Proxy)", False, f"Error: {str(e)}")
    
    def test_cors_headers(self):
        """Test CORS headers are preserved through proxy"""
        print("\n🔒 Testing CORS Headers...")
        
        try:
            headers = {
                "Origin": "https://calm-space-12.preview.emergentagent.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            }
            
            response = requests.options(f"{PROXY_URL}/api/health", headers=headers, timeout=10)
            
            cors_headers = {
                "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
                "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
                "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers")
            }
            
            if any(cors_headers.values()):
                self.log_result("CORS Headers", True, f"CORS headers present")
            else:
                self.log_result("CORS Headers", False, f"No CORS headers found")
                
        except Exception as e:
            self.log_result("CORS Headers", False, f"Error: {str(e)}")
    
    def test_error_handling(self):
        """Test proxy error handling"""
        print("\n⚠️  Testing Error Handling...")
        
        # Test non-existent API endpoint
        try:
            response = requests.get(f"{PROXY_URL}/api/nonexistent", timeout=10)
            if response.status_code == 404:
                self.log_result("404 Error Handling", True, f"Proper 404 response")
            else:
                self.log_result("404 Error Handling", False, f"Unexpected status: {response.status_code}")
        except Exception as e:
            self.log_result("404 Error Handling", False, f"Error: {str(e)}")
        
        # Test non-existent website page
        try:
            response = requests.get(f"{PROXY_URL}/nonexistent-page", timeout=10)
            if response.status_code in [404, 500]:
                self.log_result("Website 404 Handling", True, f"Proper error response: {response.status_code}")
            else:
                self.log_result("Website 404 Handling", False, f"Unexpected status: {response.status_code}")
        except Exception as e:
            self.log_result("Website 404 Handling", False, f"Error: {str(e)}")
    
    def test_startup_script(self):
        """Test if the startup script can be executed"""
        print("\n🚀 Testing Startup Script...")
        
        # Check if startup script exists and is executable
        startup_script = "/app/start-all-services.sh"
        if os.path.exists(startup_script):
            if os.access(startup_script, os.X_OK):
                self.log_result("Startup Script Executable", True, "Script exists and is executable")
            else:
                self.log_result("Startup Script Executable", False, "Script exists but not executable")
        else:
            self.log_result("Startup Script Executable", False, "Startup script not found")
    
    def test_unified_proxy_server(self):
        """Test if unified proxy server is running"""
        print("\n🔀 Testing Unified Proxy Server...")
        
        # Check if proxy server is responding
        try:
            response = requests.get(f"{PROXY_URL}/", timeout=5)
            if response.status_code == 200:
                self.log_result("Unified Proxy Server", True, f"Proxy server responding on port 8080")
            else:
                self.log_result("Unified Proxy Server", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("Unified Proxy Server", False, f"Connection error: {str(e)}")
    
    def test_websocket_support(self):
        """Test WebSocket support for Expo HMR (basic connectivity test)"""
        print("\n🔌 Testing WebSocket Support...")
        
        # This is a basic test - we can't easily test WebSocket upgrade without proper client
        # But we can test if the proxy handles WebSocket-related headers
        try:
            headers = {
                "Connection": "Upgrade",
                "Upgrade": "websocket",
                "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
                "Sec-WebSocket-Version": "13"
            }
            
            response = requests.get(f"{PROXY_URL}/app", headers=headers, timeout=5)
            # We expect this to either upgrade or handle gracefully
            if response.status_code in [101, 200, 400, 426]:  # Various valid responses
                self.log_result("WebSocket Support", True, f"WebSocket headers handled (status: {response.status_code})")
            else:
                self.log_result("WebSocket Support", False, f"Unexpected status: {response.status_code}")
        except Exception as e:
            self.log_result("WebSocket Support", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all unified proxy server and backend tests"""
        print("=" * 70)
        print("🚀 EaseMind Unified Proxy Server & Backend API Test Suite")
        print("=" * 70)
        
        # Test infrastructure
        self.test_startup_script()
        self.test_services_running()
        self.test_unified_proxy_server()
        
        # Test proxy routing (CRITICAL)
        self.test_proxy_backend_routing()
        self.test_proxy_website_routing()
        self.test_proxy_frontend_routing()
        
        # Test backend functionality through proxy
        self.test_backend_api_functionality()
        
        # Test additional features
        self.test_cors_headers()
        self.test_websocket_support()
        self.test_error_handling()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        print(f"Total Tests: {len(self.results)}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        
        if self.passed > 0:
            success_rate = (self.passed / len(self.results)) * 100
            print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.failed > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        else:
            print(f"\n🎉 All tests passed! Unified proxy server is working correctly.")
        
        return self.failed == 0

if __name__ == "__main__":
    tester = UnifiedProxyTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)