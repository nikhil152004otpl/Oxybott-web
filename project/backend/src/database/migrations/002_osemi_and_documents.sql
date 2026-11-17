-- ==============================================================================
-- OXYBOTT POSTGRESQL DATABASE MIGRATION
-- File: 002_osemi_and_documents.sql
-- Description: Adds OSEMI Purchase Link to products and creates product_documents
-- ==============================================================================

-- 1. Add OSEMI Product Purchase Link column
ALTER TABLE products ADD COLUMN IF NOT EXISTS osemi_url VARCHAR(1000);

-- 2. Create product_documents table for Tutorial and Assembly Guides, Video Links & Files
CREATE TABLE IF NOT EXISTS product_documents (
  id VARCHAR(100) PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  document_title VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL DEFAULT 'tutorial', -- 'tutorial', 'assembly_guide', 'video_tutorial', 'curriculum', 'datasheet'
  file_path VARCHAR(500) NOT NULL DEFAULT '',
  video_url VARCHAR(1000) DEFAULT NULL,
  original_filename VARCHAR(255) NOT NULL DEFAULT '',
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type VARCHAR(100) DEFAULT 'application/pdf',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure video_url column exists if table was created in earlier revision
ALTER TABLE product_documents ADD COLUMN IF NOT EXISTS video_url VARCHAR(1000) DEFAULT NULL;

-- Index for high performance document retrieval by product
CREATE INDEX IF NOT EXISTS idx_product_documents_product_id ON product_documents(product_id);

