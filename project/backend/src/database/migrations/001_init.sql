-- ==============================================================================
-- OXYBOTT POSTGRESQL INITIAL DATABASE MIGRATION
-- File: 001_init.sql
-- ==============================================================================

-- 1. Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  slug VARCHAR(150) UNIQUE NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(150) NOT NULL,
  tagline TEXT,
  description TEXT,
  series VARCHAR(100),
  age VARCHAR(50),
  grade VARCHAR(50),
  price NUMERIC(10, 2) NOT NULL,
  sale_price NUMERIC(10, 2),
  stock_quantity INTEGER DEFAULT 100,
  low_stock_threshold INTEGER DEFAULT 5,
  is_published BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  badge VARCHAR(50),
  rating NUMERIC(3, 2) DEFAULT 5.00,
  reviews_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Product Categories (Many-to-Many)
CREATE TABLE IF NOT EXISTS product_categories (
  product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- 5. Product Images Gallery
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_main BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Product Specifications (Key/Value pairs)
CREATE TABLE IF NOT EXISTS product_specifications (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  spec_key VARCHAR(150) NOT NULL,
  spec_value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 7. Product Highlights
CREATE TABLE IF NOT EXISTS product_highlights (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  highlight_text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 8. Product Box Contents
CREATE TABLE IF NOT EXISTS product_box_contents (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 9. Homepage Banners & Promotions
CREATE TABLE IF NOT EXISTS banners (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  image_url VARCHAR(500),
  cta_text VARCHAR(100),
  cta_link VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Site Settings & Dynamic Key/Value Store
CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Administrative Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  username VARCHAR(100),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100),
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Inquiries & Leads
CREATE TABLE IF NOT EXISTS inquiries (
  id VARCHAR(100) PRIMARY KEY,
  type VARCHAR(50) NOT NULL DEFAULT 'contact',
  name VARCHAR(200),
  email VARCHAR(255) NOT NULL,
  organization VARCHAR(200),
  phone VARCHAR(50),
  subject VARCHAR(300),
  message TEXT,
  details TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_series ON products(series);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_product_images_pid ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_type ON inquiries(type);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at);

