const { Pool } = require('pg');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let pgPool = null;
let sqliteDb = null;
let activeDriver = 'pg';

const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'oxybott'}`;

/**
 * Initialize SQLite fallback instance for environments without a running PostgreSQL daemon
 */
function getSqliteFallback() {
  if (!sqliteDb) {
    const candidates = [
      process.env.SQLITE_DB_PATH ? path.resolve(process.env.SQLITE_DB_PATH) : null,
      path.resolve(__dirname, '../../data/oxybott.db'),
      path.resolve(__dirname, '../../../../data/oxybott.db')
    ].filter(Boolean);

    let dbFile = candidates.find(p => fs.existsSync(p)) || path.resolve(__dirname, '../../data/oxybott.db');
    const dbDir = path.dirname(dbFile);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    sqliteDb = new DatabaseSync(dbFile);
    sqliteDb.exec('PRAGMA journal_mode = WAL;');
    sqliteDb.exec('PRAGMA foreign_keys = ON;');

    // Ensure inquiries table exists
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL DEFAULT 'contact',
        name TEXT,
        email TEXT NOT NULL,
        organization TEXT,
        phone TEXT,
        subject TEXT,
        message TEXT,
        details TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure tutorials table exists
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS tutorials (
        id TEXT PRIMARY KEY,
        product_id TEXT,
        title TEXT NOT NULL,
        lesson_tag TEXT DEFAULT 'Lesson 01 • 15 Mins',
        description TEXT,
        thumbnail_url TEXT,
        video_url TEXT,
        video_file_path TEXT,
        pdf_file_path TEXT,
        sort_order INTEGER DEFAULT 0,
        is_published INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed initial 6 tutorials if empty
    try {
      const tutCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM tutorials').get();
      if (tutCount && tutCount.count === 0) {
        const initTutorials = [
          {
            id: 'tut-qd022',
            product_id: 'qd022',
            title: 'Oxybott QD022 4-DOF Robot Arm Mechanical Assembly & Servo Zeroing',
            lesson_tag: 'Lesson 01 • 24 Mins',
            description: 'Learn how to correctly assemble the laser-cut acrylic chassis, mount the 4 metal-gear servos, and calibrate zero angles before powering on.',
            thumbnail_url: '/assets/images/qd022-robot-arm.png',
            video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            sort_order: 1
          },
          {
            id: 'tut-qd001',
            product_id: 'qd001',
            title: 'Oxybott QD001 Mecanum Wheel Car: Line Tracking & Ultrasonic Ranging',
            lesson_tag: 'Lesson 02 • 18 Mins',
            description: 'Assemble the 4-wheel independent motor drive and configure the 3-channel infrared line tracker using OxyCode block logic.',
            thumbnail_url: '/assets/images/qd001-robot-car.png',
            video_url: '',
            sort_order: 2
          },
          {
            id: 'tut-qe011',
            product_id: 'qe011',
            title: 'Oxybott QE011 Weather Station: Wi-Fi IoT Cloud Telemetry with ThingSpeak',
            lesson_tag: 'Lesson 03 • 15 Mins',
            description: 'Connect your ESP32 to home or school Wi-Fi and push live atmospheric temperature, humidity, and raindrop data to an online dashboard.',
            thumbnail_url: '/assets/images/qe011-weather-station.png',
            video_url: '',
            sort_order: 3
          },
          {
            id: 'tut-qe001',
            product_id: 'qe001',
            title: 'Oxybott QE001 Smart Home: RFID Keyfob Door Locks & Gas Leak Buzzer Alarm',
            lesson_tag: 'Lesson 04 • 22 Mins',
            description: 'Build an automated smart home security model. Read RFID cards, trigger servo deadbolts, and wire analog gas/smoke detectors.',
            thumbnail_url: '/assets/images/qe001-smart-home.png',
            video_url: '',
            sort_order: 4
          },
          {
            id: 'tut-qd020',
            product_id: 'qd020',
            title: 'Oxybott QD020 Quadruped Spider: 8-Servo Bio-inspired Gait Programming',
            lesson_tag: 'Lesson 05 • 30 Mins',
            description: 'Step-by-step calibration of 8 servos. Implement crawl kinematics, self-stabilization, and smartphone Bluetooth posture navigation.',
            thumbnail_url: '/assets/images/qd020-spider-robot.png',
            video_url: '',
            sort_order: 5
          },
          {
            id: 'tut-qe200',
            product_id: 'qe200',
            title: "Oxybott QE200 ESP32 Starter: From 'Blink LED' to Web Server Hosting",
            lesson_tag: 'Lesson 06 • 12 Mins',
            description: 'Master foundational breadboard circuitry, pull-up resistors, active buzzer tones, and host an interactive HTML web server on ESP32.',
            thumbnail_url: '/assets/images/qe200-starter-kit.jpg',
            video_url: '',
            sort_order: 6
          }
        ];

        const stmt = sqliteDb.prepare(`
          INSERT INTO tutorials (id, product_id, title, lesson_tag, description, thumbnail_url, video_url, video_file_path, pdf_file_path, sort_order, is_published)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const t of initTutorials) {
          stmt.run(t.id, t.product_id, t.title, t.lesson_tag, t.description, t.thumbnail_url, t.video_url || '', '', '', t.sort_order, 1);
        }
      }
    } catch (e) {
      console.error('Error seeding tutorials:', e);
    }

    // --- Ensure Centralized CMS Architecture Tables Exist ---
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        meta_title TEXT,
        meta_description TEXT,
        is_published INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS page_sections (
        id TEXT PRIMARY KEY,
        page_id TEXT NOT NULL,
        section_key TEXT NOT NULL,
        section_type TEXT NOT NULL,
        tag TEXT,
        title TEXT,
        subtitle TEXT,
        description TEXT,
        content_data TEXT NOT NULL DEFAULT '{}',
        is_visible INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(page_id, section_key),
        FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS navigation_menus (
        id TEXT PRIMARY KEY,
        menu_key TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS navigation_items (
        id TEXT PRIMARY KEY,
        menu_id TEXT NOT NULL,
        parent_id TEXT,
        label TEXT NOT NULL,
        url TEXT NOT NULL,
        target TEXT DEFAULT '_self',
        badge TEXT,
        sort_order INTEGER DEFAULT 0,
        is_visible INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(menu_id) REFERENCES navigation_menus(id) ON DELETE CASCADE,
        FOREIGN KEY(parent_id) REFERENCES navigation_items(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS software_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        icon TEXT,
        icon_bg TEXT DEFAULT 'var(--oxy-primary-light)',
        icon_color TEXT DEFAULT 'var(--oxy-primary)',
        short_desc TEXT,
        description TEXT,
        supported_os TEXT DEFAULT '[]',
        primary_btn_text TEXT,
        primary_btn_action TEXT,
        secondary_btn_text TEXT,
        secondary_btn_action TEXT,
        sort_order INTEGER DEFAULT 0,
        is_published INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS software_releases (
        id TEXT PRIMARY KEY,
        software_id TEXT NOT NULL,
        version TEXT NOT NULL,
        platform TEXT NOT NULL,
        architecture TEXT,
        release_notes TEXT,
        file_name TEXT,
        file_path TEXT,
        file_size INTEGER DEFAULT 0,
        file_type TEXT,
        external_url TEXT,
        sha256_checksum TEXT,
        is_latest INTEGER DEFAULT 1,
        is_published INTEGER DEFAULT 1,
        download_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(software_id) REFERENCES software_items(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        mime_type TEXT,
        asset_type TEXT DEFAULT 'image',
        alt_text TEXT,
        dimensions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS faq_items (
        id TEXT PRIMARY KEY,
        category TEXT DEFAULT 'General',
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        is_published INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  return sqliteDb;
}

/**
 * Get or create PostgreSQL connection pool
 */
function getPgPool() {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' && !connectionString.includes('localhost') 
        ? { rejectUnauthorized: false } 
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    });

    pgPool.on('error', (err) => {
      console.error('[PostgreSQL Pool Notice]', err.message);
    });
  }
  return pgPool;
}

/**
 * Test connectivity to database engine
 */
async function testConnection() {
  if (process.env.USE_SQLITE === 'true') {
    activeDriver = 'sqlite-fallback';
    getSqliteFallback();
    return { success: true, db: 'sqlite-fallback', time: new Date().toISOString(), driver: 'sqlite' };
  }

  try {
    const pool = getPgPool();
    const res = await pool.query('SELECT NOW() as current_time, current_database() as db');
    activeDriver = 'pg';
    return { success: true, db: res.rows[0].db, time: res.rows[0].current_time, driver: 'pg' };
  } catch (err) {
    activeDriver = 'sqlite-fallback';
    getSqliteFallback();
    return { success: true, db: 'sqlite-storage', time: new Date().toISOString(), driver: 'sqlite' };
  }
}

/**
 * Helper to convert PostgreSQL $1, $2 query into SQLite ? placeholders
 */
function translatePgToSqlite(sql, params) {
  let translatedSql = sql;

  translatedSql = translatedSql.replace(/\bILIKE\b/gi, 'LIKE');
  translatedSql = translatedSql.replace(/\bTRUE\b/g, '1').replace(/\bFALSE\b/g, '0');
  translatedSql = translatedSql.replace(/\(NOW\(\)\s*-\s*INTERVAL\s*'(\d+)\s*seconds'\)/gi, "datetime('now', '-$1 seconds')");
  translatedSql = translatedSql.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');
  translatedSql = translatedSql.replace(/\$(\d+)/g, '?');

  const translatedParams = params.map(p => {
    if (p === undefined) return null;
    if (typeof p === 'boolean') return p ? 1 : 0;
    return p;
  });

  return { sql: translatedSql, params: translatedParams };
}

/**
 * Execute parameterized query
 */
async function query(text, params = []) {
  if (activeDriver === 'pg') {
    try {
      const pool = getPgPool();
      const res = await pool.query(text, params);
      return res;
    } catch (err) {
      if (
        err.code === 'ECONNREFUSED' ||
        err.code === 'EACCES' ||
        err.name === 'AggregateError' ||
        err.message?.includes('connect') ||
        err.message?.includes('EACCES')
      ) {
        activeDriver = 'sqlite-fallback';
        return query(text, params);
      }
      throw err;
    }
  }

  const db = getSqliteFallback();
  const { sql: sSql, params: sParams } = translatePgToSqlite(text, params);

  const trimmed = sSql.trim();
  const isSelect = trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('PRAGMA');

  try {
    const stmt = db.prepare(sSql);
    if (isSelect) {
      const rows = stmt.all(...sParams);
      return { rows, rowCount: rows.length };
    } else {
      const info = stmt.run(...sParams);
      return {
        rows: [{ id: info.lastInsertRowid }],
        rowCount: info.changes,
        lastInsertRowid: info.lastInsertRowid
      };
    }
  } catch (err) {
    console.error('[SQL Execution Error]', { sql: sSql, params: sParams, error: err.message });
    throw err;
  }
}

/**
 * Execute transaction
 */
async function transaction(callback) {
  if (activeDriver === 'pg') {
    try {
      const pool = getPgPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'EACCES' || err.message.includes('connect')) {
        activeDriver = 'sqlite-fallback';
        return transaction(callback);
      }
      throw err;
    }
  }

  const db = getSqliteFallback();
  db.exec('BEGIN TRANSACTION;');
  try {
    const client = {
      query: async (sqlText, p = []) => {
        const { sql: sSql, params: sParams } = translatePgToSqlite(sqlText, p);
        const trimmed = sSql.trim();
        const isSelect = trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('PRAGMA');
        const stmt = db.prepare(sSql);
        if (isSelect) {
          const rows = stmt.all(...sParams);
          return { rows, rowCount: rows.length };
        } else {
          const info = stmt.run(...sParams);
          return { rows: [{ id: info.lastInsertRowid }], rowCount: info.changes };
        }
      }
    };
    const result = await callback(client);
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

module.exports = {
  getPgPool,
  query,
  transaction,
  testConnection
};
