import os
from openai import OpenAI
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# OpenAI client
openai_client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables")

supabase: Client = create_client(supabase_url, supabase_key)

# Helper functions for database operations
async def get_startup_by_id(startup_id: str):
    """Get startup by ID from Supabase"""
    try:
        response = supabase.table("startups").select("*").eq("id", startup_id).single().execute()
        return response.data
    except Exception as e:
        print(f"Error fetching startup: {e}")
        return None

async def get_documents_by_startup_id(startup_id: str):
    """Get all documents for a startup"""
    try:
        response = supabase.table("documents").select("*").eq("startup_id", startup_id).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching documents: {e}")
        return []

async def get_metrics_by_startup_id(startup_id: str):
    """Get metrics for a startup"""
    try:
        response = supabase.table("metrics").select("*").eq("startup_id", startup_id).single().execute()
        return response.data
    except Exception as e:
        print(f"Error fetching metrics: {e}")
        return None

async def get_notes_by_startup_id(startup_id: str, limit: int = None):
    """Get notes for a startup"""
    try:
        query = supabase.table("notes").select("*").eq("startup_id", startup_id).order("created_at", desc=True)
        if limit:
            query = query.limit(limit)
        response = query.execute()
        return response.data
    except Exception as e:
        print(f"Error fetching notes: {e}")
        return []

async def save_analysis_history(startup_id: str, analysis_type: str, content: str, trigger: str = "manual"):
    """Save analysis to history"""
    try:
        response = supabase.table("analysis_history").insert({
            "startup_id": startup_id,
            "analysis_type": analysis_type,
            "content": content,
            "trigger": trigger
        }).execute()
        return response.data
    except Exception as e:
        print(f"Error saving analysis history: {e}")
        return None