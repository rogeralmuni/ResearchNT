#!/usr/bin/env python3
"""
Test script for the Startup Analysis Platform API
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint"""
    print("Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_root_endpoint():
    """Test the root endpoint"""
    print("Testing root endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Root endpoint: {data['message']}")
            return True
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
        return False

def test_document_processing():
    """Test document processing endpoint"""
    print("Testing document processing...")
    try:
        test_data = {
            "content": "This is a test document for a fintech startup. We have 1000 monthly active users and $50k MRR.",
            "document_name": "test_doc.txt"
        }
        
        response = requests.post(f"{BASE_URL}/api/process-document", json=test_data)
        if response.status_code == 200:
            data = response.json()
            print("✅ Document processing works")
            print(f"   Summary: {data['summary'][:100]}...")
            return True
        else:
            print(f"❌ Document processing failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Document processing error: {e}")
        return False

def test_vectorize_text():
    """Test text vectorization endpoint"""
    print("Testing text vectorization...")
    try:
        test_data = {
            "text": "This is a test text for vectorization"
        }
        
        response = requests.post(f"{BASE_URL}/api/vectorize-text", json=test_data)
        if response.status_code == 200:
            data = response.json()
            print("✅ Text vectorization works")
            print(f"   Embedding length: {len(data['embedding'])}")
            return True
        else:
            print(f"❌ Text vectorization failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Text vectorization error: {e}")
        return False

def test_market_research():
    """Test market research endpoint"""
    print("Testing market research...")
    try:
        test_data = {
            "startup_name": "Test Fintech",
            "sector": "Financial Technology",
            "description": "A startup that provides digital banking solutions"
        }
        
        response = requests.post(f"{BASE_URL}/api/research-market", json=test_data)
        if response.status_code == 200:
            data = response.json()
            print("✅ Market research works")
            print(f"   Analysis length: {len(data['market_analysis'])} characters")
            return True
        else:
            print(f"❌ Market research failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Market research error: {e}")
        return False

def main():
    """Run all API tests"""
    print("🚀 Starting API tests...")
    print(f"Testing API at: {BASE_URL}")
    print("=" * 50)
    
    tests = [
        test_health_check,
        test_root_endpoint,
        test_document_processing,
        test_vectorize_text,
        test_market_research
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"Tests completed: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        sys.exit(0)
    else:
        print("⚠️  Some tests failed. Check the API server and environment variables.")
        sys.exit(1)

if __name__ == "__main__":
    main()