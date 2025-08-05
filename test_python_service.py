#!/usr/bin/env python3
"""
Test script for the Python Research Service
"""

import asyncio
import aiohttp
import json
import os

async def test_market_research():
    """Test market research endpoint"""
    print("🧪 Testing Market Research...")
    
    url = "http://localhost:8001/api/research/market"
    payload = {
        "startupId": "test-123",
        "startupName": "Test Startup",
        "startupDescription": "A technology startup focused on AI solutions",
        "startupSector": "Technology"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    print("✅ Market research test passed")
                    print(f"Research report length: {len(result.get('research_report', ''))} characters")
                    return True
                else:
                    print(f"❌ Market research test failed: {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Market research test error: {e}")
        return False

async def test_competitors_research():
    """Test competitors research endpoint"""
    print("🧪 Testing Competitors Research...")
    
    url = "http://localhost:8001/api/research/competitors"
    payload = {
        "startupId": "test-123",
        "startupName": "Test Startup",
        "startupDescription": "A technology startup focused on AI solutions",
        "startupSector": "Technology"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    print("✅ Competitors research test passed")
                    print(f"Research report length: {len(result.get('research_report', ''))} characters")
                    return True
                else:
                    print(f"❌ Competitors research test failed: {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Competitors research test error: {e}")
        return False

async def test_streaming_market_research():
    """Test streaming market research endpoint"""
    print("🧪 Testing Streaming Market Research...")
    
    url = "http://localhost:8001/api/research/market/stream"
    payload = {
        "startupId": "test-123",
        "startupName": "Test Startup",
        "startupDescription": "A technology startup focused on AI solutions",
        "startupSector": "Technology"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    print("✅ Streaming market research test passed")
                    print("Streaming response received")
                    
                    # Read a few chunks to verify streaming works
                    chunk_count = 0
                    async for chunk in response.content.iter_chunked(1024):
                        chunk_count += 1
                        if chunk_count >= 5:  # Read first 5 chunks
                            break
                    
                    print(f"Received {chunk_count} chunks")
                    return True
                else:
                    print(f"❌ Streaming market research test failed: {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Streaming market research test error: {e}")
        return False

async def main():
    """Run all tests"""
    print("🚀 Starting Python Research Service Tests")
    print("=" * 50)
    
    # Check if service is running
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("http://localhost:8001/docs") as response:
                if response.status != 200:
                    print("❌ Python service is not running on localhost:8001")
                    print("Please start the service first:")
                    print("python python_research_service.py")
                    return
    except Exception as e:
        print("❌ Cannot connect to Python service")
        print("Please start the service first:")
        print("python python_research_service.py")
        return
    
    print("✅ Python service is running")
    
    # Run tests
    tests = [
        test_market_research(),
        test_competitors_research(),
        test_streaming_market_research()
    ]
    
    results = await asyncio.gather(*tests, return_exceptions=True)
    
    # Report results
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    
    passed = 0
    total = len(results)
    
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            print(f"❌ Test {i+1} failed with exception: {result}")
        elif result:
            print(f"✅ Test {i+1} passed")
            passed += 1
        else:
            print(f"❌ Test {i+1} failed")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The Python service is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the service configuration.")

if __name__ == "__main__":
    asyncio.run(main()) 