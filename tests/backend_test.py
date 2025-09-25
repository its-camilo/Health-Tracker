#!/usr/bin/env python3
"""
Backend API Testing Script for Health Analysis App
Tests all authentication, document upload, and dashboard endpoints
"""

import requests
import json
import base64
import io
from PIL import Image
import os
import sys

# Configuration
BASE_URL = "https://health-tracker-129.preview.emergentagent.com/api"
TEST_USER_EMAIL = "maria.gonzalez@example.com"
TEST_USER_PASSWORD = "SecurePass123!"
TEST_USER_NAME = "María González"

class HealthAppTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.auth_token = None
        self.user_id = None
        self.document_id = None
        
    def log_test(self, test_name, success, details=""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        print()
        
    def test_user_registration(self):
        """Test POST /api/auth/register"""
        print("🔐 Testing User Registration...")
        
        payload = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/auth/register",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    self.user_id = data["user"]["id"]
                    self.log_test(
                        "User Registration", 
                        True, 
                        f"User created with ID: {self.user_id}"
                    )
                    return True
                else:
                    self.log_test(
                        "User Registration", 
                        False, 
                        f"Missing required fields in response: {data}"
                    )
                    return False
            elif response.status_code == 400:
                # User might already exist, try login instead
                self.log_test(
                    "User Registration", 
                    True, 
                    "User already exists (expected behavior)"
                )
                return self.test_user_login()
            else:
                self.log_test(
                    "User Registration", 
                    False, 
                    f"Status: {response.status_code}, Response: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test POST /api/auth/login"""
        print("🔑 Testing User Login...")
        
        payload = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    self.user_id = data["user"]["id"]
                    self.log_test(
                        "User Login", 
                        True, 
                        f"Login successful for user: {data['user']['name']}"
                    )
                    return True
                else:
                    self.log_test(
                        "User Login", 
                        False, 
                        f"Missing required fields in response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "User Login", 
                    False, 
                    f"Status: {response.status_code}, Response: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
            return False
    
    def test_get_current_user(self):
        """Test GET /api/auth/me"""
        print("👤 Testing Get Current User...")
        
        if not self.auth_token:
            self.log_test("Get Current User", False, "No auth token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{self.base_url}/auth/me",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "email", "name", "has_gemini_key"]
                if all(field in data for field in required_fields):
                    self.log_test(
                        "Get Current User", 
                        True, 
                        f"User info retrieved: {data['name']} ({data['email']})"
                    )
                    return True
                else:
                    self.log_test(
                        "Get Current User", 
                        False, 
                        f"Missing required fields in response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Get Current User", 
                    False, 
                    f"Status: {response.status_code}, Response: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("Get Current User", False, f"Exception: {str(e)}")
            return False
    
    def create_test_image(self):
        """Create a test image for upload testing"""
        try:
            # Create a simple test image
            img = Image.new('RGB', (300, 300), color='lightblue')
            
            # Add some simple content to make it look like a hair analysis image
            from PIL import ImageDraw
            draw = ImageDraw.Draw(img)
            draw.rectangle([50, 50, 250, 250], outline='black', width=2)
            draw.text((100, 150), "Test Hair Image", fill='black')
            
            # Save to bytes
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='JPEG')
            img_bytes.seek(0)
            
            return img_bytes.getvalue()
        except Exception as e:
            print(f"Error creating test image: {e}")
            return None
    
    def test_document_upload(self):
        """Test POST /api/documents/upload"""
        print("📄 Testing Document Upload...")
        
        if not self.auth_token:
            self.log_test("Document Upload", False, "No auth token available")
            return False
        
        try:
            # Create test image
            test_image_data = self.create_test_image()
            if not test_image_data:
                self.log_test("Document Upload", False, "Failed to create test image")
                return False
            
            headers = {
                "Authorization": f"Bearer {self.auth_token}"
            }
            
            files = {
                'file': ('test_hair_image.jpg', test_image_data, 'image/jpeg')
            }
            
            data = {
                'document_type': 'image'
            }
            
            response = self.session.post(
                f"{self.base_url}/documents/upload",
                headers=headers,
                files=files,
                data=data
            )
            
            if response.status_code == 200:
                response_data = response.json()
                required_fields = ["document_id", "filename", "type", "message"]
                if all(field in response_data for field in required_fields):
                    self.document_id = response_data["document_id"]
                    self.log_test(
                        "Document Upload", 
                        True, 
                        f"Document uploaded: {response_data['filename']} (ID: {self.document_id})"
                    )
                    return True
                else:
                    self.log_test(
                        "Document Upload", 
                        False, 
                        f"Missing required fields in response: {response_data}"
                    )
                    return False
            else:
                self.log_test(
                    "Document Upload", 
                    False, 
                    f"Status: {response.status_code}, Response: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("Document Upload", False, f"Exception: {str(e)}")
            return False
    
    def test_dashboard(self):
        """Test GET /api/dashboard"""
        print("📊 Testing Dashboard...")
        
        if not self.auth_token:
            self.log_test("Dashboard", False, "No auth token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{self.base_url}/dashboard",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_documents", "analyzed_documents", "recent_analyses"]
                if all(field in data for field in required_fields):
                    self.log_test(
                        "Dashboard", 
                        True, 
                        f"Dashboard data retrieved - Total docs: {data['total_documents']}, Analyzed: {data['analyzed_documents']}"
                    )
                    return True
                else:
                    self.log_test(
                        "Dashboard", 
                        False, 
                        f"Missing required fields in response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Dashboard", 
                    False, 
                    f"Status: {response.status_code}, Response: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("Dashboard", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Backend API Tests for Health Analysis App")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        test_results = []
        
        # Test authentication flow
        test_results.append(self.test_user_registration())
        if not self.auth_token:
            test_results.append(self.test_user_login())
        
        if self.auth_token:
            test_results.append(self.test_get_current_user())
            test_results.append(self.test_document_upload())
            test_results.append(self.test_dashboard())
        else:
            print("❌ Cannot proceed with authenticated tests - no valid token")
            test_results.extend([False, False, False])
        
        # Summary
        print("=" * 60)
        print("📋 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(test_results)
        total = len(test_results)
        
        print(f"Tests Passed: {passed}/{total}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return False

def main():
    """Main function to run the tests"""
    tester = HealthAppTester()
    success = tester.run_all_tests()
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()