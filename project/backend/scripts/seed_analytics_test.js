/**
 * Realistic Analytics Test Data Seed & Clean Script for Oxybott
 * Usage:
 *   node project/backend/scripts/seed_analytics_test.js --seed
 *   node project/backend/scripts/seed_analytics_test.js --clean
 */
const { randomUUID } = require('crypto');
const { query, testConnection } = require('../src/config/db');
const { hashIp, maskIp } = require('../src/utils/trafficClassifier');

const PRODUCTS = [
  { id: 'qd001', name: 'Oxybott QD001 Mecanum Wheel Car' },
  { id: 'qd002', name: 'Oxybott QD002 Smart Bionic Quadruped' },
  { id: 'qd003', name: 'Oxybott QD003 IoT Weather Station Kit' },
  { id: 'qd022', name: 'Oxybott QD022 4-DOF Robotic Arm' }
];

const SEARCH_TERMS = [
  { text: 'robot arm', count: 4 },
  { text: 'starter kit', count: 6 },
  { text: 'mecanum wheel', count: 2 },
  { text: 'python tutorial', count: 8 },
  { text: 'line follower sensor', count: 3 },
  { text: 'arduino wifi shield', count: 0 },
  { text: 'esp32 cam module', count: 0 },
  { text: 'servo motor calibration', count: 2 }
];

const GEO_LOCATIONS = [
  { country: 'India', city: 'Bengaluru' },
  { country: 'India', city: 'Mumbai' },
  { country: 'India', city: 'New Delhi' },
  { country: 'India', city: 'Hyderabad' },
  { country: 'India', city: 'Pune' },
  { country: 'India', city: 'Chennai' },
  { country: 'United States', city: 'San Jose' },
  { country: 'United States', city: 'Austin' },
  { country: 'United Kingdom', city: 'London' },
  { country: 'Germany', city: 'Berlin' }
];

const DEVICES = [
  { type: 'desktop', browser: 'Chrome', os: 'Windows', weight: 45 },
  { type: 'desktop', browser: 'Chrome', os: 'macOS', weight: 15 },
  { type: 'mobile', browser: 'Chrome Mobile', os: 'Android', weight: 25 },
  { type: 'mobile', browser: 'Safari Mobile', os: 'iOS', weight: 10 },
  { type: 'tablet', browser: 'Safari', os: 'iPadOS', weight: 5 }
];

const CHANNELS = [
  { channel: 'Direct', referrer: '', utm_source: '', utm_medium: '', utm_campaign: '' },
  { channel: 'Organic Search', referrer: 'https://www.google.com/', utm_source: '', utm_medium: '', utm_campaign: '' },
  { channel: 'Organic Search', referrer: 'https://www.bing.com/', utm_source: '', utm_medium: '', utm_campaign: '' },
  { channel: 'Social', referrer: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', utm_source: '', utm_medium: '', utm_campaign: '' },
  { channel: 'Social', referrer: 'https://www.instagram.com/p/oxybott_robotics/', utm_source: '', utm_medium: '', utm_campaign: '' },
  { channel: 'Social', referrer: 'https://x.com/robotics_daily', utm_source: '', utm_medium: '', utm_campaign: '' },
  { channel: 'osemi.in', referrer: 'https://osemi.in/products/stem-robotics', utm_source: 'osemi', utm_medium: 'partner', utm_campaign: 'stem_kits' },
  { channel: 'Paid', referrer: 'https://www.google.com/', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'stem_robotics_2026' },
  { channel: 'Referral', referrer: 'https://hackaday.com/2026/01/15/open-source-robot-arm/', utm_source: '', utm_medium: '', utm_campaign: '' }
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickDevice() {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const d of DEVICES) {
    cumulative += d.weight;
    if (rand <= cumulative) return d;
  }
  return DEVICES[0];
}

async function cleanTestData() {
  console.log('🧹 Cleaning test analytics data (is_test = 1)...');
  try {
    await query('DELETE FROM page_views WHERE session_id IN (SELECT id FROM visitor_sessions WHERE is_test = 1)');
    await query('DELETE FROM analytics_events WHERE session_id IN (SELECT id FROM visitor_sessions WHERE is_test = 1)');
    await query('DELETE FROM search_queries WHERE session_id IN (SELECT id FROM visitor_sessions WHERE is_test = 1)');
    const res = await query('DELETE FROM visitor_sessions WHERE is_test = 1');
    const botRes = await query("DELETE FROM bot_hits WHERE reason LIKE '%test%' OR ip_masked LIKE '%test%'");
    console.log(`✅ Cleaned test sessions: ${res.rowCount || 0}`);
    console.log(`✅ Cleaned test bot hits: ${botRes.rowCount || 0}`);
  } catch (err) {
    console.error('❌ Error during clean:', err.message);
  }
}

async function seedTestData() {
  console.log('🌱 Generating 30 days of realistic visitor analytics test data...');
  const now = new Date();
  let totalSessions = 0;
  let totalPageViews = 0;
  let totalEvents = 0;
  let totalSearches = 0;
  let totalBotHits = 0;

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const baseDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    // 15 - 30 sessions per day
    const sessionCount = Math.floor(Math.random() * 16) + 15;

    for (let s = 0; s < sessionCount; s++) {
      const sessionId = randomUUID();
      const visitorId = 'anon_test_' + randomUUID().substring(0, 8);
      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);

      const sessionDate = new Date(baseDate);
      sessionDate.setHours(hour, minute, second, 0);
      const sessionStartIso = sessionDate.toISOString();

      const device = pickDevice();
      const geo = pickRandom(GEO_LOCATIONS);
      const chan = pickRandom(CHANNELS);
      const isNewVisitor = Math.random() < 0.65 ? 1 : 0;
      const fakeIp = `157.34.${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 250) + 1}`;
      const maskedIp = maskIp(fakeIp);

      // Determine session behavior profile:
      // Profile A: Quick bounce (30%) - 1 page, 3-8s active, not engaged
      // Profile B: Engaged reader (40%) - 2-4 pages, 30-180s active, engaged
      // Profile C: Product browser & buyer (30%) - 3-6 pages, 60-350s active, Buy Now click, engaged
      const profileRand = Math.random();
      let activeSeconds = 0;
      let isEngaged = 0;
      let pagesToVisit = [];

      if (profileRand < 0.30) {
        // Quick bounce
        activeSeconds = Math.floor(Math.random() * 8) + 2;
        isEngaged = 0;
        pagesToVisit = ['/'];
      } else if (profileRand < 0.70) {
        // Engaged reader
        activeSeconds = Math.floor(Math.random() * 150) + 30;
        isEngaged = 1;
        pagesToVisit = ['/', '/tutorials', pickRandom(['/tutorials/tut-qd001', '/tutorials/tut-qd022', '/about'])];
      } else {
        // Product explorer & high-value buyer
        activeSeconds = Math.floor(Math.random() * 240) + 50;
        isEngaged = 1;
        const prod = pickRandom(PRODUCTS);
        pagesToVisit = ['/', '/products', `/products/${prod.id}`];
      }

      const sessionDuration = activeSeconds + Math.floor(Math.random() * 20);
      const sessionEnd = new Date(sessionDate.getTime() + sessionDuration * 1000).toISOString();
      const landingPage = pagesToVisit[0];

      // Insert visitor session
      await query(`
        INSERT INTO visitor_sessions (
          id, anonymous_id, ip_address, device_type, browser, os,
          referrer, utm_source, utm_medium, utm_campaign, landing_page,
          session_start, session_end, last_seen, page_count, duration_seconds,
          active_seconds, is_engaged, is_bot, channel, country, city,
          is_new_visitor, is_admin_test, is_test
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22,
          $23, $24, $25
        )
      `, [
        sessionId, visitorId, maskedIp, device.type, device.browser, device.os,
        chan.referrer, chan.utm_source, chan.utm_medium, chan.utm_campaign, landingPage,
        sessionStartIso, sessionEnd, sessionEnd, pagesToVisit.length, sessionDuration,
        activeSeconds, isEngaged, 0, chan.channel, geo.country, geo.city,
        isNewVisitor, 0, 1
      ]);
      totalSessions++;

      // Insert Page Views
      let pageOffset = 0;
      for (const p of pagesToVisit) {
        const pvTime = new Date(sessionDate.getTime() + pageOffset * 1000).toISOString();
        const timeOnPage = Math.floor(activeSeconds / pagesToVisit.length);
        await query(`
          INSERT INTO page_views (id, session_id, page_path, page_title, viewed_at, time_on_page)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          randomUUID(), sessionId, p,
          p === '/' ? 'Home • Oxybott' : `Oxybott ${p}`,
          pvTime, timeOnPage
        ]);
        totalPageViews++;
        pageOffset += 25;
      }

      // If Product explorer profile, add conversion / interest events!
      if (profileRand >= 0.70) {
        const prod = pickRandom(PRODUCTS);
        const eventTime = new Date(sessionDate.getTime() + (pageOffset + 10) * 1000).toISOString();

        // 1. Image gallery click
        await query(`
          INSERT INTO analytics_events (
            id, session_id, anonymous_id, event_type, entity_type, entity_id, entity_title, metadata, page_path, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          randomUUID(), sessionId, visitorId, 'image_gallery_view', 'product', prod.id, prod.name,
          JSON.stringify({ image_index: 1 }), `/products/${prod.id}`, eventTime
        ]);
        totalEvents++;

        // 2. Buy Now Click (60% of product explorers)
        if (Math.random() < 0.60) {
          const buyTime = new Date(sessionDate.getTime() + (pageOffset + 25) * 1000).toISOString();
          await query(`
            INSERT INTO analytics_events (
              id, session_id, anonymous_id, event_type, entity_type, entity_id, entity_title, metadata, page_path, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            randomUUID(), sessionId, visitorId, 'buy_now_click', 'product', prod.id, prod.name,
            JSON.stringify({ external_url: `https://osemi.in/checkout?prod=${prod.id}`, channel: chan.channel }),
            `/products/${prod.id}`, buyTime
          ]);
          totalEvents++;
        }

        // 3. Datasheet download (25% of product explorers)
        if (Math.random() < 0.25) {
          const dlTime = new Date(sessionDate.getTime() + (pageOffset + 35) * 1000).toISOString();
          await query(`
            INSERT INTO analytics_events (
              id, session_id, anonymous_id, event_type, entity_type, entity_id, entity_title, metadata, page_path, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            randomUUID(), sessionId, visitorId, 'document_download', 'document', `${prod.id}-manual`, `${prod.name} Datasheet`,
            JSON.stringify({ file_format: 'pdf' }), `/products/${prod.id}`, dlTime
          ]);
          totalEvents++;
        }
      }

      // Add a search query occasionally (25% of sessions)
      if (Math.random() < 0.25) {
        const item = pickRandom(SEARCH_TERMS);
        const searchTime = new Date(sessionDate.getTime() + 15000).toISOString();
        await query(`
          INSERT INTO search_queries (id, session_id, anonymous_id, query_text, result_count, clicked_entity_id, page_path, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          randomUUID(), sessionId, visitorId, item.text, item.count,
          item.count > 0 ? 'qd001' : '', '/search', searchTime
        ]);
        totalSearches++;
      }
    }

    // Add 2-4 bot crawler hits per day
    const botCount = Math.floor(Math.random() * 3) + 2;
    for (let b = 0; b < botCount; b++) {
      const botDate = new Date(baseDate);
      botDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
      const botAgents = [
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
        'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
        'curl/7.88.1'
      ];
      await query(`
        INSERT INTO bot_hits (id, user_agent, ip_masked, reason, page_path, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        randomUUID(), pickRandom(botAgents), '66.249.*.* (test)', 'Crawler / Automated Bot Match (test)',
        pickRandom(['/', '/products', '/sitemap.xml', '/robots.txt']), botDate.toISOString()
      ]);
      totalBotHits++;
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Realistic Test Data Seed Complete!`);
  console.log(`📊 Sessions Created:     ${totalSessions}`);
  console.log(`📄 Page Views Created:   ${totalPageViews}`);
  console.log(`⚡ Events (Buy Now/etc): ${totalEvents}`);
  console.log(`🔍 Searches Created:     ${totalSearches}`);
  console.log(`🤖 Bot Hits Created:     ${totalBotHits}`);
  console.log(`🏷️ Flagged with:         is_test = 1`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

async function main() {
  await testConnection();
  const arg = process.argv[2] || '--seed';
  if (arg === '--clean') {
    await cleanTestData();
  } else if (arg === '--seed') {
    await cleanTestData(); // Clean prior test data first to keep deterministic
    await seedTestData();
  } else {
    console.log('Usage: node seed_analytics_test.js [--seed | --clean]');
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
