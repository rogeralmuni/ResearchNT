#!/bin/bash

# Startup script for FastAPI backend

# Load environment variables if .env file exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install/upgrade pip
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo "Warning: OPENAI_API_KEY not set"
fi

if [ -z "$SUPABASE_URL" ]; then
    echo "Warning: SUPABASE_URL not set"
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "Warning: SUPABASE_ANON_KEY not set"
fi

# Start the FastAPI server
echo "Starting FastAPI server..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload