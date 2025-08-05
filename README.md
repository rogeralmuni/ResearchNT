# Startup Analysis Platform

A comprehensive web application for analyzing startup companies using AI-powered tools and document processing capabilities.

## Features

- **Document Upload & Processing**: Upload and analyze startup documents (PDFs, images, etc.)
- **AI-Powered Analysis**: Get detailed insights about startups using OpenAI integration
- **Chat Interface**: Interactive chat with AI for startup analysis
- **Market Research**: Automated market research and competitor analysis
- **Startup Comparison**: Compare multiple startups side by side
- **Memo Generation**: Generate professional investment memos
- **Semantic Search**: Advanced search through analyzed documents

## Tech Stack

- **Frontend**: Next.js with TypeScript
- **Backend**: FastAPI with Python (converted from TypeScript)
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI API
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **State Management**: Custom store with Zustand

## Getting Started

### Prerequisites

- Python 3.11 or higher
- Node.js (v16 or higher) for frontend
- npm or yarn
- Supabase account
- OpenAI API key

### Backend Setup (FastAPI)

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file in the backend directory:
```env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Run the FastAPI backend:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Or use the startup script:
```bash
./start.sh
```

The API will be available at [http://localhost:8000](http://localhost:8000)
API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend Setup (Next.js)

1. Navigate to the root directory (where package.json is located):
```bash
cd ..  # if you're in the backend directory
```

2. Install frontend dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

4. Set up the database:
Run the SQL schema in your Supabase dashboard:
```sql
-- Check db/schema.sql for the complete schema
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Docker Setup (Optional)

For containerized deployment:

1. Navigate to the backend directory:
```bash
cd backend
```

2. Build and run with Docker Compose:
```bash
docker-compose up --build
```

This will start the FastAPI backend on port 8000.

## Project Structure

```
Principal/
├── backend/             # FastAPI Python backend
│   ├── routers/         # API route handlers
│   ├── main.py          # FastAPI application
│   ├── schemas.py       # Pydantic models
│   ├── database.py      # Database models
│   ├── clients.py       # External service clients
│   ├── requirements.txt # Python dependencies
│   ├── Dockerfile       # Docker configuration
│   └── start.sh         # Startup script
├── components/          # React components
├── db/                 # Database schema
├── lib/                # Utility libraries (legacy)
├── pages/              # Next.js pages
├── store/              # State management
└── styles/             # Global styles
```

## API Routes

The FastAPI backend provides the following endpoints:

- `POST /api/analyze-startup` - Analyze startup documents
- `POST /api/chat-analysis` - Chat with AI about startups
- `POST /api/process-document` - Process uploaded documents
- `POST /api/extract-text` - Extract text from documents
- `POST /api/vectorize-text` - Vectorize text for semantic search
- `POST /api/semantic-search` - Perform semantic search
- `POST /api/research-market` - Research market information
- `POST /api/download-memo` - Download generated memos
- `POST /api/analysis-history` - Get analysis history

Visit [http://localhost:8000/docs](http://localhost:8000/docs) for interactive API documentation.

## Migration from TypeScript to Python

The backend has been converted from Next.js API routes (TypeScript) to FastAPI (Python). Key changes:

1. **API Structure**: All `/pages/api/*` routes moved to FastAPI routers
2. **Database**: Using Supabase client with Pydantic models
3. **Authentication**: Maintained Supabase Auth integration
4. **AI Integration**: Updated to use latest OpenAI Python client
5. **Document Processing**: Enhanced with better error handling
6. **Deployment**: Added Docker support for easier deployment

### Frontend Updates Required

To use the new Python backend, update your frontend API calls to point to:
- Development: `http://localhost:8000/api`
- Production: Your deployed FastAPI URL

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team. 