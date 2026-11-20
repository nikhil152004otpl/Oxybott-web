-- ==============================================================================
-- OXYBOTT POSTGRESQL DATABASE MIGRATION
-- File: 006_advanced_analytics.sql
-- Description: Advanced Interaction Events & Search Analytics Tables
-- ==============================================================================

-- 1. Analytics Events (Interactions, Clicks, Downloads, Video Progress)
CREATE TABLE IF NOT EXISTS analytics_events (
  id VARCHAR(100) PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL REFERENCES visitor_sessions(id) ON DELETE CASCADE,
  anonymous_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) DEFAULT '',
  entity_id VARCHAR(100) DEFAULT '',
  entity_title VARCHAR(255) DEFAULT '',
  metadata TEXT DEFAULT '{}',
  page_path TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ae_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ae_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ae_entity ON analytics_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ae_created_at ON analytics_events(created_at);

-- 2. Search Analytics (Keywords, Zero-Result Queries, Clicks)
CREATE TABLE IF NOT EXISTS search_queries (
  id VARCHAR(100) PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL REFERENCES visitor_sessions(id) ON DELETE CASCADE,
  anonymous_id VARCHAR(100) NOT NULL,
  query_text VARCHAR(255) NOT NULL,
  result_count INTEGER DEFAULT 0,
  clicked_entity_id VARCHAR(100) DEFAULT '',
  page_path TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sq_query_text ON search_queries(query_text);
CREATE INDEX IF NOT EXISTS idx_sq_result_count ON search_queries(result_count);
CREATE INDEX IF NOT EXISTS idx_sq_created_at ON search_queries(created_at);
