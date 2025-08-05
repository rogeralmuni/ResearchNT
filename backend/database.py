from sqlalchemy import create_engine, Column, String, Text, DateTime, Numeric, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import os
from supabase import create_client, Client
from typing import Optional

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

Base = declarative_base()

class Startup(Base):
    __tablename__ = "startups"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    sector = Column(Text)
    stage = Column(Text)
    country = Column(Text)
    description = Column(Text)
    website = Column(Text)
    status = Column(Text)  # en análisis, invertida, descartada
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    documents = relationship("Document", back_populates="startup")
    metrics = relationship("Metric", back_populates="startup")
    notes = relationship("Note", back_populates="startup")
    analysis_history = relationship("AnalysisHistory", back_populates="startup")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    startup_id = Column(UUID(as_uuid=True), ForeignKey("startups.id"))
    name = Column(Text)
    type = Column(Text)  # pitchdeck, plan financiero, etc.
    url = Column(Text)
    summary = Column(Text)
    kpis = Column(JSON)
    red_flags = Column(Text)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    embedding = Column(Text)  # Vector embedding for search
    
    # Relationships
    startup = relationship("Startup", back_populates="documents")

class Metric(Base):
    __tablename__ = "metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    startup_id = Column(UUID(as_uuid=True), ForeignKey("startups.id"))
    arr = Column(Numeric)
    mrr = Column(Numeric)
    cac = Column(Numeric)
    ltv = Column(Numeric)
    churn = Column(Numeric)
    runway = Column(Numeric)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    startup = relationship("Startup", back_populates="metrics")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    startup_id = Column(UUID(as_uuid=True), ForeignKey("startups.id"))
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    startup = relationship("Startup", back_populates="notes")

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(Text, unique=True, nullable=False)
    name = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    startup_id = Column(UUID(as_uuid=True), ForeignKey("startups.id"))
    analysis_type = Column(Text, nullable=False)  # 'investment', 'market_research', 'chat'
    content = Column(Text, nullable=False)
    trigger = Column(Text, default='manual')  # 'manual', 'document_upload', 'metrics_update', 'note_added'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    startup = relationship("Startup", back_populates="analysis_history")

# Database dependency for FastAPI
def get_supabase_client():
    return supabase