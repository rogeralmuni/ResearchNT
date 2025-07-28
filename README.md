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
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI API
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **State Management**: Custom store with Zustand

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd Principal
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
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

## Project Structure

```
Principal/
├── components/          # React components
├── db/                 # Database schema
├── lib/                # Utility libraries
├── pages/              # Next.js pages and API routes
├── store/              # State management
└── styles/             # Global styles
```

## API Routes

- `/api/analyze-startup` - Analyze startup documents
- `/api/chat-analysis` - Chat with AI about startups
- `/api/process-document` - Process uploaded documents
- `/api/extract-text` - Extract text from documents
- `/api/vectorize-text` - Vectorize text for semantic search
- `/api/semantic-search` - Perform semantic search
- `/api/research-market` - Research market information
- `/api/download-memo` - Download generated memos
- `/api/analysis-history` - Get analysis history

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