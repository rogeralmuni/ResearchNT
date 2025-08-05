# Python Research Service Setup

This guide explains how to set up and run the Python-based research service that provides proper streaming functionality for market and competitor research.

## Overview

The Python service uses the OpenAI Agents framework to provide:
- Real-time streaming research results
- Web search capabilities
- Proper event handling for research progress
- Better reliability than the TypeScript SDK approach

## Prerequisites

1. **Python 3.8+** installed on your system
2. **OpenAI API Key** with access to the agents framework
3. **Node.js** (for the Next.js frontend)

## Setup Instructions

### 1. Install Python Dependencies

```bash
# Install required Python packages
pip install -r requirements.txt
```

### 2. Set Environment Variables

```bash
# Set your OpenAI API key
export OPENAI_API_KEY="your-openai-api-key-here"

# Optional: Set Python service URL (defaults to localhost:8001)
export PYTHON_SERVICE_URL="http://localhost:8001"
```

### 3. Start the Python Service

```bash
# Option 1: Use the startup script
python start_python_service.py

# Option 2: Run directly
python python_research_service.py
```

The service will start on `http://localhost:8001`

### 4. Start the Next.js Frontend

In a separate terminal:

```bash
# Install Node.js dependencies (if not already done)
npm install

# Start the Next.js development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

The Python service provides the following endpoints:

### Streaming Endpoints
- `POST /api/research/market/stream` - Stream market research
- `POST /api/research/competitors/stream` - Stream competitors research

### Non-Streaming Endpoints
- `POST /api/research/market` - Market research (blocking)
- `POST /api/research/competitors` - Competitors research (blocking)

## Usage

### Frontend Integration

The Next.js frontend automatically proxies requests to the Python service:

1. **Market Research**: Click "Generar Reporte de Mercado" in the Market Analysis tab
2. **Competitors Research**: Click "Research Competitors" in the Competitors tab

### Direct API Usage

```bash
# Market research (streaming)
curl -X POST http://localhost:8001/api/research/market/stream \
  -H "Content-Type: application/json" \
  -d '{
    "startupId": "123",
    "startupName": "Example Startup",
    "startupDescription": "A technology startup",
    "startupSector": "Technology"
  }'

# Competitors research (streaming)
curl -X POST http://localhost:8001/api/research/competitors/stream \
  -H "Content-Type: application/json" \
  -d '{
    "startupId": "123",
    "startupName": "Example Startup",
    "startupDescription": "A technology startup",
    "startupSector": "Technology"
  }'
```

## Features

### Real-time Streaming
- See research progress as it happens
- Web search queries are displayed in real-time
- Agent switches are shown
- Error handling with proper feedback

### Web Search Integration
- Uses OpenAI's WebSearchTool
- Searches for current market data
- Finds competitor information
- Gathers industry reports

### Event Types
The streaming response includes different event types:
- `content`: Actual research text
- `search`: Web search queries being performed
- `agent_updated`: Agent switching events
- `error`: Error messages

## Troubleshooting

### Common Issues

1. **Import Error**: Make sure all requirements are installed
   ```bash
   pip install -r requirements.txt
   ```

2. **API Key Error**: Ensure OPENAI_API_KEY is set
   ```bash
   export OPENAI_API_KEY="your-key-here"
   ```

3. **Port Already in Use**: Change the port in `python_research_service.py`
   ```python
   uvicorn.run(app, host="0.0.0.0", port=8002)  # Change port
   ```

4. **Connection Refused**: Make sure the Python service is running before starting Next.js

### Debug Mode

To run with debug logging:

```bash
python python_research_service.py --log-level debug
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js       │    │   Python         │    │   OpenAI        │
│   Frontend      │◄──►│   Research       │◄──►│   Agents        │
│   (Port 3000)   │    │   Service        │    │   Framework     │
│                 │    │   (Port 8001)    │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Benefits Over TypeScript SDK

1. **Better Streaming**: Proper Server-Sent Events implementation
2. **Web Search**: Native web search capabilities
3. **Event Handling**: Rich event system for progress tracking
4. **Reliability**: More stable than TypeScript SDK streaming
5. **Debugging**: Better error messages and logging

## Development

To modify the research prompts or add new features:

1. Edit `python_research_service.py`
2. Modify the agent instructions or prompts
3. Restart the Python service
4. Test via the frontend or direct API calls 