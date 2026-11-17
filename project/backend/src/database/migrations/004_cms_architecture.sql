-- ==============================================================================
-- OXYBOTT POSTGRESQL DATABASE MIGRATION
-- File: 004_cms_architecture.sql
-- Description: Centralized CMS Architecture for 100% Admin-Managed Dynamic Website
-- ==============================================================================

-- 1. Pages Registry (for SEO and Section Parentage)
CREATE TABLE IF NOT EXISTS pages (
  id VARCHAR(100) PRIMARY KEY,
  slug VARCHAR(150) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  meta_title VARCHAR(255),
  meta_description TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_published ON pages(is_published);

-- 2. Page Sections (Modular, schema-validated content blocks)
CREATE TABLE IF NOT EXISTS page_sections (
  id VARCHAR(100) PRIMARY KEY,
  page_id VARCHAR(100) NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  section_key VARCHAR(100) NOT NULL,
  section_type VARCHAR(100) NOT NULL,
  tag VARCHAR(100),
  title VARCHAR(255),
  subtitle TEXT,
  description TEXT,
  content_data TEXT NOT NULL DEFAULT '{}',
  is_visible BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_page_section UNIQUE (page_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_page_sections_page_id ON page_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_sort ON page_sections(sort_order);
CREATE INDEX IF NOT EXISTS idx_page_sections_visible ON page_sections(is_visible);

-- 3. Navigation Menus & Items (Header, MegaMenu, Footer Columns)
CREATE TABLE IF NOT EXISTS navigation_menus (
  id VARCHAR(100) PRIMARY KEY,
  menu_key VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(150) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS navigation_items (
  id VARCHAR(100) PRIMARY KEY,
  menu_id VARCHAR(100) NOT NULL REFERENCES navigation_menus(id) ON DELETE CASCADE,
  parent_id VARCHAR(100) REFERENCES navigation_items(id) ON DELETE CASCADE,
  label VARCHAR(150) NOT NULL,
  url VARCHAR(500) NOT NULL,
  target VARCHAR(50) DEFAULT '_self',
  badge VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nav_items_menu_id ON navigation_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_nav_items_parent_id ON navigation_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_nav_items_sort ON navigation_items(sort_order);

-- 4. Software & Robotics Ecosystem Products
CREATE TABLE IF NOT EXISTS software_items (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  icon VARCHAR(255),
  icon_bg VARCHAR(100) DEFAULT 'var(--oxy-primary-light)',
  icon_color VARCHAR(100) DEFAULT 'var(--oxy-primary)',
  short_desc VARCHAR(255),
  description TEXT,
  supported_os TEXT DEFAULT '[]',
  primary_btn_text VARCHAR(100),
  primary_btn_action VARCHAR(500),
  secondary_btn_text VARCHAR(100),
  secondary_btn_action VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_software_items_slug ON software_items(slug);
CREATE INDEX IF NOT EXISTS idx_software_items_published ON software_items(is_published);
CREATE INDEX IF NOT EXISTS idx_software_items_sort ON software_items(sort_order);

-- 5. Software Releases & Multi-Platform Downloads (.exe, .msi, .dmg, .pkg, .apk, .zip, .bin, .hex, .uf2, .pdf)
CREATE TABLE IF NOT EXISTS software_releases (
  id VARCHAR(100) PRIMARY KEY,
  software_id VARCHAR(100) NOT NULL REFERENCES software_items(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'windows', 'macos', 'android', 'linux', 'firmware', 'library', 'guide'
  architecture VARCHAR(50), -- 'x64', 'arm64', 'universal', etc.
  release_notes TEXT,
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_size BIGINT DEFAULT 0,
  file_type VARCHAR(50), -- '.exe', '.dmg', '.apk', '.zip', '.bin', '.pdf', etc.
  external_url VARCHAR(1000),
  sha256_checksum VARCHAR(100),
  is_latest BOOLEAN DEFAULT TRUE,
  is_published BOOLEAN DEFAULT TRUE,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_software_releases_software_id ON software_releases(software_id);
CREATE INDEX IF NOT EXISTS idx_software_releases_platform ON software_releases(platform);
CREATE INDEX IF NOT EXISTS idx_software_releases_latest ON software_releases(is_latest);
CREATE INDEX IF NOT EXISTS idx_software_releases_published ON software_releases(is_published);

-- 6. Media Library Assets
CREATE TABLE IF NOT EXISTS media_assets (
  id VARCHAR(100) PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT DEFAULT 0,
  mime_type VARCHAR(100),
  asset_type VARCHAR(50) DEFAULT 'image', -- 'image', 'document', 'software', 'icon'
  alt_text VARCHAR(255),
  dimensions VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets(created_at);

-- 7. Frequently Asked Questions (FAQ)
CREATE TABLE IF NOT EXISTS faq_items (
  id VARCHAR(100) PRIMARY KEY,
  category VARCHAR(100) DEFAULT 'General',
  question VARCHAR(500) NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faq_items_published ON faq_items(is_published);
CREATE INDEX IF NOT EXISTS idx_faq_items_sort ON faq_items(sort_order);

