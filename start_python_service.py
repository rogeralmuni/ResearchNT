#!/usr/bin/env python3
"""
Startup script for the Python Research Service
"""

import os
import sys
import subprocess
import time

def install_requirements():
    """Install required packages"""
    print("Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        return False
    return True

def start_service():
    """Start the FastAPI service"""
    print("Starting Python Research Service...")
    print("Service will be available at: http://localhost:8001")
    print("API Documentation: http://localhost:8001/docs")
    
    try:
        # Set environment variables
        os.environ["PYTHON_SERVICE_URL"] = "http://localhost:8001"
        
        # Import and run the service
        from python_research_service import app
        import uvicorn
        
        uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure all requirements are installed")
        return False
    except Exception as e:
        print(f"❌ Failed to start service: {e}")
        return False

def main():
    """Main startup function"""
    print("🚀 Starting Python Research Service...")
    print("=" * 50)
    
    # Check if OPENAI_API_KEY is set
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ OPENAI_API_KEY environment variable is not set")
        print("Please set your OpenAI API key:")
        print("export OPENAI_API_KEY='your-api-key-here'")
        return False
    
    # Install requirements
    if not install_requirements():
        return False
    
    # Start the service
    start_service()

if __name__ == "__main__":
    main() 