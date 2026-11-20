-- ==============================================================================
-- OXYBOTT POSTGRESQL DATABASE MIGRATION
-- File: 005_analytics_security.sql
-- Description: Visitor Analytics, Cookie Consent & Security Monitoring Tables
-- ==============================================================================

-- 1. Visitor Sessions
CREATE TABLE IF NOT EXISTS visitor_sessions (
  id VARCHAR(100) PRIMARY KEY,
  anonymous_id VARCHAR(100) NOT NULL,
  ip_address VARCHAR(100),
  device_type VARCHAR(50) DEFAULT 'desktop',
  browser VARCHAR(100),
  os VARCHAR(100),
  referrer TEXT DEFAULT '',
  utm_source VARCHAR(150) DEFAULT '',
  utm_medium VARCHAR(150) DEFAULT '',
  utm_campaign VARCHAR(150) DEFAULT '',
  landing_page TEXT,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  session_end TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  page_count INTEGER DEFAULT 1,
  duration_seconds INTEGER DEFAULT 0,
  active_seconds INTEGER DEFAULT 0,
  is_engaged BOOLEAN DEFAULT FALSE,
  is_bot BOOLEAN DEFAULT FALSE,
  channel VARCHAR(50) DEFAULT 'Direct',
  country VARCHAR(100) DEFAULT '',
  city VARCHAR(100) DEFAULT '',
  is_new_visitor BOOLEAN DEFAULT TRUE,
  is_admin_test BOOLEAN DEFAULT FALSE,
  is_test BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_vs_anonymous_id ON visitor_sessions(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_vs_session_start ON visitor_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_vs_last_seen ON visitor_sessions(last_seen);
CREATE INDEX IF NOT EXISTS idx_vs_is_engaged ON visitor_sessions(is_engaged);
CREATE INDEX IF NOT EXISTS idx_vs_channel ON visitor_sessions(channel);

-- Excluded IPs & Bot Hits
CREATE TABLE IF NOT EXISTS excluded_ips (
  id VARCHAR(100) PRIMARY KEY,
  ip_pattern VARCHAR(100) NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bot_hits (
  id VARCHAR(100) PRIMARY KEY,
  user_agent TEXT,
  ip_masked VARCHAR(100),
  reason VARCHAR(100),
  page_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bh_created ON bot_hits(created_at);

-- 2. Page Views
CREATE TABLE IF NOT EXISTS page_views (
  id VARCHAR(100) PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL REFERENCES visitor_sessions(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  page_title VARCHAR(255) DEFAULT '',
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  time_on_page INTEGER
);

CREATE INDEX IF NOT EXISTS idx_pv_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_pv_viewed_at ON page_views(viewed_at);

-- 3. Security Events
CREATE TABLE IF NOT EXISTS security_events (
  id VARCHAR(100) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  ip_address VARCHAR(100),
  username VARCHAR(150),
  details TEXT,
  severity VARCHAR(50) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_se_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_se_ip_address ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_se_event_type ON security_events(event_type);

-- 4. Cookie Consents
CREATE TABLE IF NOT EXISTS cookie_consents (
  id VARCHAR(100) PRIMARY KEY,
  anonymous_id VARCHAR(100) UNIQUE NOT NULL,
  analytics_accepted BOOLEAN DEFAULT FALSE,
  functional_accepted BOOLEAN DEFAULT FALSE,
  marketing_accepted BOOLEAN DEFAULT FALSE,
  consent_version VARCHAR(20) DEFAULT '1.0',
  ip_address VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cc_anonymous_id ON cookie_consents(anonymous_id);
