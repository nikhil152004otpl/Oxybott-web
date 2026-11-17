-- ==============================================================================
-- OXYBOTT POSTGRESQL DATABASE MIGRATION
-- File: 003_tutorials.sql
-- Description: Creates tutorials table for step-by-step build & coding guides
-- ==============================================================================

CREATE TABLE IF NOT EXISTS tutorials (
  id VARCHAR(100) PRIMARY KEY,
  product_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  lesson_tag VARCHAR(100) DEFAULT 'Lesson 01 • 15 Mins',
  description TEXT,
  thumbnail_url VARCHAR(500),
  video_url VARCHAR(1000),
  video_file_path VARCHAR(500),
  pdf_file_path VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tutorials_product_id ON tutorials(product_id);
CREATE INDEX IF NOT EXISTS idx_tutorials_sort_order ON tutorials(sort_order);
CREATE INDEX IF NOT EXISTS idx_tutorials_is_published ON tutorials(is_published);

