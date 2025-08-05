#!/bin/bash

# Production deployment script for FastAPI backend

set -e  # Exit on any error

echo "🚀 Starting deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one based on .env.example"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Validate required environment variables
required_vars=("OPENAI_API_KEY" "SUPABASE_URL" "SUPABASE_ANON_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Environment variable $var is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run tests if test script exists
if [ -f "test_api.py" ]; then
    echo "🧪 Running tests..."
    # Start server in background for testing
    uvicorn main:app --host 0.0.0.0 --port 8000 &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Run tests
    python test_api.py
    
    # Kill test server
    kill $SERVER_PID
    
    echo "✅ Tests passed"
fi

# Start production server
echo "🌟 Starting production server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4