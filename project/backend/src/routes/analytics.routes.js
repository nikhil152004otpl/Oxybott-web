/**
 * Analytics Routes – Visitor tracking + Admin analytics dashboard API
 * 
 * Features:
 * - Active Session Duration (pauses on idle/blur, capped, ignores corrupt timestamps)
 * - Zero-filled time-series chart (hourly for Today/Yesterday, daily for 7d/30d/90d)
 * - Internal IP exclusion & Bot filtering with transparent bot hit logging
 * - Traffic source normalization (Direct, Organic Search, Social, Referral, Email, Paid, osemi.in, Internal)
 * - Engagement Rate (active >= 10s OR 2+ pages OR high-value interaction) & inverse Bounce Rate
 * - KPI comparative analysis vs previous equal period (% change deltas)
 * - Top products, Buy Now CTR, top search keywords, and geo distribution
 * - Daily rotating salt IP hashing / masking
 */
const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/auth');
const { query } = require('../config/db');
const { UAParser } = require('ua-parser-js');
const { randomUUID } = require('crypto');
const {
  hashIp,
  maskIp,
  isBot,
  classifyTrafficSource,
  formatIST,
  IST_OFFSET_MS
} = require('../utils/trafficClassifier');

// ─── Timezone & Date Range Calculation (Asia/Kolkata IST) ────────────────────
function getISTDateRange(queryObj) {
  const r = (typeof queryObj === 'string' ? queryObj : (queryObj?.range || '')).toString().toLowerCase();
  const startDate = typeof queryObj === 'object' ? queryObj?.startDate : null;
  const endDate = typeof queryObj === 'object' ? queryObj?.endDate : null;

  const nowUtc = new Date();
  const nowIst = new Date(nowUtc.getTime() + IST_OFFSET_MS);

  const istYear = nowIst.getUTCFullYear();
  const istMonth = nowIst.getUTCMonth();
  const istDate = nowIst.getUTCDate();

  const istMidnightToUtc = (y, m, d) => new Date(Date.UTC(y, m, d, 0, 0, 0) - IST_OFFSET_MS);
  const istEndOfDayToUtc = (y, m, d) => new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - IST_OFFSET_MS);

  let since;
  let until = nowUtc.toISOString();

  if (r === 'today') {
    since = istMidnightToUtc(istYear, istMonth, istDate).toISOString();
    until = nowUtc.toISOString();
  } else if (r === 'yesterday') {
    since = istMidnightToUtc(istYear, istMonth, istDate - 1).toISOString();
    until = istEndOfDayToUtc(istYear, istMonth, istDate - 1).toISOString();
  } else if (startDate) {
    const [sY, sM, sD] = startDate.split('-').map(Number);
    since = istMidnightToUtc(sY, sM - 1, sD).toISOString();
    if (endDate) {
      const [eY, eM, eD] = endDate.split('-').map(Number);
      until = istEndOfDayToUtc(eY, eM - 1, eD).toISOString();
    } else {
      until = istEndOfDayToUtc(sY, sM - 1, sD).toISOString();
    }
  } else {
    const days = parseInt(r, 10) || 30;
    since = istMidnightToUtc(istYear, istMonth, istDate - days + 1).toISOString();
    until = nowUtc.toISOString();
  }

  return { since, until };
}

function getPriorDateRange(since, until) {
  const s = new Date(since).getTime();
  const u = new Date(until).getTime();
  const diff = Math.max(u - s, 86400000);
  return {
    priorSince: new Date(s - diff).toISOString(),
    priorUntil: new Date(s).toISOString()
  };
}

const parseDateRange = getISTDateRange;

// Helper: Check if an IP matches any excluded pattern
async function isIpExcluded(clientIp) {
  if (!clientIp) return false;
  try {
    const rows = await query('SELECT ip_pattern FROM excluded_ips');
    for (const row of rows.rows) {
      const pattern = (row.ip_pattern || '').trim();
      if (!pattern) continue;
      if (pattern.includes('*')) {
        const prefix = pattern.replace(/\*+$/, '');
        if (clientIp.startsWith(prefix)) return true;
      } else if (clientIp === pattern) {
        return true;
      }
    }
  } catch {}
  return false;
}

// ─── PUBLIC: Heartbeat & Active Time Tracker ─────────────────────────────────
// POST /api/analytics/heartbeat
// ─────────────────────────────────────────────────────────────────────────────
router.post('/heartbeat', async (req, res) => {
  try {
    const {
      visitorId,
      sessionId,
      pagePath,
      pageTitle,
      activeDelta,
      isAdminTest,
      isFinal
    } = req.body;

    if (!visitorId || !sessionId) {
      return res.json({ success: true, message: 'Missing visitor or session id' });
    }

    const now = new Date().toISOString();
    const adminTestVal = isAdminTest ? 1 : 0;
    // Cap delta between 0 and 60s per pulse to prevent corrupt or spoofed jumps
    const delta = Math.min(Math.max(parseInt(activeDelta, 10) || 0, 0), 60);

    const sess = await query('SELECT id, active_seconds, page_count FROM visitor_sessions WHERE id = $1', [sessionId]);

    if (sess.rows.length > 0) {
      const currentActive = parseInt(sess.rows[0].active_seconds || 0, 10);
      const newActive = Math.min(14400, currentActive + delta); // Sane maximum: 4 hours
      const pageCount = parseInt(sess.rows[0].page_count || 1, 10);
      const isEngaged = (newActive >= 10 || pageCount >= 2) ? 1 : 0;

      await query(`
        UPDATE visitor_sessions
        SET last_seen = $1,
            session_end = $1,
            active_seconds = $2,
            duration_seconds = $2,
            is_engaged = CASE WHEN is_engaged = 1 THEN 1 ELSE $3 END
        WHERE id = $4
      `, [now, newActive, isEngaged, sessionId]);
    } else {
      const rawIp = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
      const ipMasked = maskIp(rawIp);
      const ua = req.headers['user-agent'] || '';
      const parser = new UAParser(ua);
      const browser = parser.getBrowser().name || 'Unknown';
      const os = parser.getOS().name || 'Unknown';
      const deviceType = parser.getDevice().type || 'desktop';
      const isEngaged = delta >= 10 ? 1 : 0;

      await query(`
        INSERT INTO visitor_sessions 
          (id, anonymous_id, ip_address, device_type, browser, os,
           landing_page, session_start, session_end, last_seen,
           page_count, duration_seconds, active_seconds, is_engaged, is_new_visitor, is_admin_test)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $8, 1, $9, $9, $10, 1, $11)
        ON CONFLICT (id) DO UPDATE SET
          last_seen = excluded.last_seen,
          session_end = excluded.session_end
      `, [sessionId, visitorId, ipMasked, deviceType, browser, os, pagePath || '/', now, delta, isEngaged, adminTestVal]);
    }

    res.json({ success: true, timestamp: now });
  } catch (err) {
    console.error('[Analytics Heartbeat Error]', err.message);
    res.json({ success: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Track Page View
// POST /api/analytics/track
// ─────────────────────────────────────────────────────────────────────────────
router.post('/track', async (req, res) => {
  try {
    const {
      visitorId,
      sessionId,
      pagePath,
      pageTitle,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      isNewSession,
      timeOnPrevPage,
      prevPagePath,
      consentGiven,
      isAdminTest
    } = req.body;

    if (!consentGiven) {
      return res.json({ success: true, message: 'Tracking skipped: no consent' });
    }

    if (!visitorId || !sessionId || !pagePath) {
      return res.json({ success: true, message: 'Insufficient tracking data' });
    }

    const rawIp = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
    const ua = req.headers['user-agent'] || '';

    // 1. Basic Bot Filtering & Logging
    if (isBot(ua)) {
      const bhId = randomUUID();
      await query(`
        INSERT INTO bot_hits (id, user_agent, ip_masked, reason, page_path, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [bhId, ua.slice(0, 255), maskIp(rawIp), 'User-Agent Match', pagePath || '/', new Date().toISOString()]).catch(() => {});
      return res.json({ success: true, bot: true });
    }

    // 2. Check Excluded Internal IPs
    let adminFlag = isAdminTest ? 1 : 0;
    if (await isIpExcluded(rawIp)) {
      adminFlag = 1;
    }

    // 3. Privacy IP Masking & Hashing (Never store raw IP)
    const ipMasked = maskIp(rawIp);

    // 4. Source & Channel Normalization
    const host = req.headers.host || '';
    const { channel } = classifyTrafficSource(referrer, utmSource, utmMedium, utmCampaign, host);

    // 5. Geographic Country & City
    const headerCountry = req.headers['cf-ipcountry'] || req.headers['x-country-code'] || '';
    const country = headerCountry || (rawIp.startsWith('127.') || rawIp === '::1' ? 'India' : 'Unknown');
    const city = rawIp.startsWith('127.') || rawIp === '::1' ? 'Kolkata' : '';

    const parser = new UAParser(ua);
    const browser = parser.getBrowser().name || 'Unknown';
    const os = parser.getOS().name || 'Unknown';
    const deviceType = parser.getDevice().type || 'desktop';
    const now = new Date().toISOString();

    const existingVisitor = await query('SELECT id FROM visitor_sessions WHERE anonymous_id = $1 LIMIT 1', [visitorId]);
    const isNewVisitor = existingVisitor.rows.length === 0;

    const existingSession = await query('SELECT id FROM visitor_sessions WHERE id = $1 LIMIT 1', [sessionId]);

    if (isNewSession || existingSession.rows.length === 0) {
      await query(`
        INSERT INTO visitor_sessions 
          (id, anonymous_id, ip_address, device_type, browser, os, referrer,
           utm_source, utm_medium, utm_campaign, landing_page, session_start,
           session_end, last_seen, page_count, duration_seconds, active_seconds,
           is_engaged, is_new_visitor, is_admin_test, channel, country, city)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 1, 0, 0, 0, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO UPDATE SET
          last_seen = excluded.last_seen,
          session_end = excluded.session_end,
          page_count = visitor_sessions.page_count + 1,
          is_engaged = CASE WHEN visitor_sessions.page_count + 1 >= 2 THEN 1 ELSE visitor_sessions.is_engaged END
      `, [
        sessionId, visitorId, ipMasked, deviceType, browser, os,
        referrer || '', utmSource || '', utmMedium || '', utmCampaign || '',
        pagePath, now, now, now, isNewVisitor ? 1 : 0, adminFlag, channel, country, city
      ]);
    } else {
      await query(`
        UPDATE visitor_sessions
        SET page_count = page_count + 1,
            session_end = $1,
            last_seen = $1,
            is_engaged = CASE WHEN (page_count + 1) >= 2 OR active_seconds >= 10 THEN 1 ELSE is_engaged END
        WHERE id = $2
      `, [now, sessionId]);
    }

    // Insert Page View
    const pvId = randomUUID();
    await query(`
      INSERT INTO page_views (id, session_id, page_path, page_title, viewed_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [pvId, sessionId, pagePath, pageTitle || '', now]);

    res.json({ success: true });
  } catch (err) {
    console.error('[Analytics Track Error]', err.message);
    res.json({ success: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Custom Event Tracking (buy_now_click, video_*, download, etc.)
// POST /api/analytics/event
// ─────────────────────────────────────────────────────────────────────────────
router.post('/event', async (req, res) => {
  try {
    const {
      visitorId,
      sessionId,
      eventType,
      entityType,
      entityId,
      entityTitle,
      metadata,
      pagePath,
      consentGiven
    } = req.body;

    if (!consentGiven || !visitorId || !sessionId || !eventType) {
      return res.json({ success: true });
    }

    const eventId = randomUUID();
    const metaStr = typeof metadata === 'object' ? JSON.stringify(metadata) : String(metadata || '{}');
    const now = new Date().toISOString();

    await query(`
      INSERT INTO analytics_events 
        (id, session_id, anonymous_id, event_type, entity_type, entity_id, entity_title, metadata, page_path, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [eventId, sessionId, visitorId, eventType, entityType || '', entityId || '', entityTitle || '', metaStr, pagePath || '', now]);

    // Meaningful user interaction marks the session as engaged!
    const highValueEvents = ['buy_now_click', 'video_play', 'document_download', 'search_query'];
    const markEngaged = highValueEvents.includes(eventType);

    await query(`
      UPDATE visitor_sessions
      SET session_end = $1,
          last_seen = $1,
          is_engaged = CASE WHEN $2 = 1 THEN 1 ELSE is_engaged END
      WHERE id = $3
    `, [now, markEngaged ? 1 : 0, sessionId]).catch(() => {});

    res.json({ success: true, eventId });
  } catch (err) {
    console.error('[Analytics Event Error]', err.message);
    res.json({ success: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Track Internal Search Queries
// POST /api/analytics/search
// ─────────────────────────────────────────────────────────────────────────────
router.post('/search', async (req, res) => {
  try {
    const {
      visitorId,
      sessionId,
      queryText,
      resultCount,
      clickedEntityId,
      pagePath,
      consentGiven
    } = req.body;

    if (!consentGiven || !queryText || !queryText.trim()) {
      return res.json({ success: true });
    }

    const searchId = randomUUID();
    const now = new Date().toISOString();

    await query(`
      INSERT INTO search_queries
        (id, session_id, anonymous_id, query_text, result_count, clicked_entity_id, page_path, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [searchId, sessionId || 'anonymous', visitorId || 'anonymous', queryText.trim().toLowerCase(), parseInt(resultCount, 10) || 0, clickedEntityId || '', pagePath || '', now]);

    // Searching marks the session as engaged
    if (sessionId) {
      await query(`UPDATE visitor_sessions SET is_engaged = 1, last_seen = $1 WHERE id = $2`, [now, sessionId]).catch(() => {});
    }

    res.json({ success: true, searchId });
  } catch (err) {
    console.error('[Analytics Search Error]', err.message);
    res.json({ success: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Store Cookie Consent
// POST /api/analytics/consent
// ─────────────────────────────────────────────────────────────────────────────
router.post('/consent', async (req, res) => {
  try {
    const { visitorId, analytics, functional, marketing, version } = req.body;
    if (!visitorId) return res.json({ success: false, error: 'Missing visitorId' });

    const rawIp = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
    const ipMasked = maskIp(rawIp);
    const now = new Date().toISOString();

    await query(`
      INSERT INTO cookie_consents 
        (id, anonymous_id, analytics_accepted, functional_accepted, marketing_accepted, 
         consent_version, ip_address, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      ON CONFLICT (anonymous_id) DO UPDATE SET
        analytics_accepted = $3, functional_accepted = $4, marketing_accepted = $5,
        consent_version = $6, updated_at = $8
    `, [randomUUID(), visitorId, analytics ? 1 : 0, functional ? 1 : 0, marketing ? 1 : 0, version || '1.0', ipMasked, now]);

    res.json({ success: true });
  } catch (err) {
    console.error('[Consent Store Error]', err.message);
    res.json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Overview Metrics with Prior-Period Comparison & E-Commerce KPIs
// GET /api/analytics/overview?range=7
// ─────────────────────────────────────────────────────────────────────────────
router.get('/overview', requireAdminAuth, async (req, res) => {
  try {
    const { since, until } = getISTDateRange(req.query);
    const { priorSince, priorUntil } = getPriorDateRange(since, until);

    // Filter helper: Exclude admin visits & bots from production reporting
    const excludeFilter = 'AND (is_admin_test IS NULL OR is_admin_test = 0) AND (is_bot IS NULL OR is_bot = 0)';

    // 1. Current Period Metrics
    const [
      totalSessionsRes,
      uniqueVisitorsRes,
      totalPageViewsRes,
      newVisitorsRes,
      returningVisitorsRes,
      engagedSessionsRes,
      avgDurationRes,
      buyNowClicksRes,
      uniqueBuyClickersRes,
      productViewsRes
    ] = await Promise.all([
      query(`SELECT COUNT(*) as cnt FROM visitor_sessions WHERE session_start >= $1 AND session_start <= $2 ${excludeFilter}`, [since, until]),
      query(`SELECT COUNT(DISTINCT anonymous_id) as cnt FROM visitor_sessions WHERE session_start >= $1 AND session_start <= $2 ${excludeFilter}`, [since, until]),
      query(`SELECT COUNT(*) as cnt FROM page_views pv JOIN visitor_sessions vs ON pv.session_id = vs.id WHERE vs.session_start >= $1 AND vs.session_start <= $2 ${excludeFilter}`, [since, until]),
      query(`SELECT COUNT(*) as cnt FROM visitor_sessions WHERE session_start >= $1 AND session_start <= $2 AND is_new_visitor = 1 ${excludeFilter}`, [since, until]),
      query(`SELECT COUNT(*) as cnt FROM visitor_sessions WHERE session_start >= $1 AND session_start <= $2 AND is_new_visitor = 0 ${excludeFilter}`, [since, until]),
      query(`SELECT COUNT(*) as cnt FROM visitor_sessions WHERE session_start >= $1 AND session_start <= $2 AND is_engaged = 1 ${excludeFilter}`, [since, until]),
      query(`SELECT AVG(active_seconds) as avg FROM visitor_sessions WHERE session_start >= $1 AND session_start <= $2 AND active_seconds >= 0 AND active_seconds <= 14400 ${excludeFilter}`, [since, until]),
      query(`SELECT COUNT(*) as cnt FROM analytics_events ae JOIN visitor_sessions vs ON ae.session_id = vs.id WHERE ae.event_type = 'buy_now_click' AND ae.created_at >= $1 AND ae.created_at <= $2 ${excludeFilter}`, [since, until]),
      query(`SELECT COUNT(DISTINCT ae.anonymous_id) as cnt FROM analytics_events ae JOIN visitor_sessions vs ON ae.session_id = vs.id WHERE ae.event_type = 'buy_now_click' AND ae.created_at >= $1 AND ae.created_at <= $2 ${excludeFilter}`, [since, until]),
      query(`SELECT COUNT(DISTINCT vs.anonymous_id) as cnt FROM page_views pv JOIN visitor_sessions vs ON pv.session_id = vs.id WHERE pv.page_path LIKE '/products/%' AND pv.viewed_at >= $1 AND pv.viewed_at <= $2 ${excludeFilter}`, [since, until])
    ]);

    // 2. Prior Period Metrics for Trend Comparisons
    const [
      priorSessionsRes,
      priorVisitorsRes,
      priorViewsRes,
      priorEngagedRes,
      priorAvgDurationRes,
      priorBuyNowRes
    ] = await Promise.all([
      query(`SELECT COUNT(*) as cnt FROM visitor_sessions WHERE session_start >= $1 AND session_start <= $2 ${excludeFilter}`, [priorSince, priorUntil]),
      query(`SELECT COUNT(DISTINCT anonymous_id) as cnt FROM visitor_sessions WHERE session_start >= $1 AND session_start <= $2 ${excludeFilter}`, [priorSince, priorUntil]),
      query(`SELECT COUNT(*) as cnt FROM page_views pv JOIN visitor_sessions vs ON pv.session_id = vs.id WHERE vs.session_start >= $1 AND vs.session_start <= $2 ${excludeFilter}`, [priorSince, priorUntil]),
      query(`SELECT COUNT(*) as cnt FROM visitor_sessions WHERE session_start >= $1 AND session_start <= $2 AND is_engaged = 1 ${excludeFilter}`, [priorSince, priorUntil]),
      query(`SELECT AVG(active_seconds) as avg FROM visitor_sessions WHERE session_start >= $1 AND session_start <= $2 AND active_seconds >= 0 AND active_seconds <= 14400 ${excludeFilter}`, [priorSince, priorUntil]),
      query(`SELECT COUNT(*) as cnt FROM analytics_events ae JOIN visitor_sessions vs ON ae.session_id = vs.id WHERE ae.event_type = 'buy_now_click' AND ae.created_at >= $1 AND ae.created_at <= $2 ${excludeFilter}`, [priorSince, priorUntil])
    ]);

    const totalSess = parseInt(totalSessionsRes.rows[0]?.cnt || 0, 10);
    const priorSess = parseInt(priorSessionsRes.rows[0]?.cnt || 0, 10);
    const engagedCount = parseInt(engagedSessionsRes.rows[0]?.cnt || 0, 10);
    const priorEngaged = parseInt(priorEngagedRes.rows[0]?.cnt || 0, 10);

    const engagementRate = totalSess > 0 ? Math.round((engagedCount / totalSess) * 100) : 0;
    const priorEngagementRate = priorSess > 0 ? Math.round((priorEngaged / priorSess) * 100) : 0;
    const bounceRate = Math.max(0, 100 - engagementRate);

    // Delta calculator helper
    const calcDelta = (curr, prior) => {
      if (prior === 0) return curr > 0 ? '+100%' : '0%';
      const pct = Math.round(((curr - prior) / prior) * 100);
      return (pct > 0 ? `+${pct}%` : `${pct}%`);
    };

    // 3. Real-time Active Visitors (last 120 seconds heartbeat)
    const twoMinAgo = new Date(Date.now() - 120000).toISOString();
    const realtimeRes = await query(
      `SELECT COUNT(DISTINCT id) as cnt FROM visitor_sessions WHERE last_seen >= $1 ${excludeFilter}`,
      [twoMinAgo]
    );

    // 4. Top Product by Views
    const topProdRes = await query(`
      SELECT p.name, p.id, COUNT(*) as views
      FROM page_views pv
      JOIN visitor_sessions vs ON pv.session_id = vs.id
      JOIN products p ON pv.page_path = '/products/' || p.id OR pv.page_path LIKE '/products/' || p.id || '/%'
      WHERE pv.viewed_at >= $1 AND pv.viewed_at <= $2 ${excludeFilter}
      GROUP BY p.id, p.name ORDER BY views DESC LIMIT 1
    `, [since, until]);

    // 5. Normalized Traffic Sources & Channels
    const sourcesRes = await query(`
      SELECT 
        COALESCE(NULLIF(channel, ''), 'Direct') as source,
        COUNT(*) as cnt
      FROM visitor_sessions
      WHERE session_start >= $1 AND session_start <= $2 ${excludeFilter}
      GROUP BY source ORDER BY cnt DESC LIMIT 8
    `, [since, until]);

    // 6. Device Distribution
    const devicesRes = await query(`
      SELECT 
        CASE 
          WHEN device_type = 'mobile' THEN 'Mobile'
          WHEN device_type = 'tablet' THEN 'Tablet'
          ELSE 'Desktop'
        END as device, COUNT(*) as cnt
      FROM visitor_sessions 
      WHERE session_start >= $1 AND session_start <= $2 ${excludeFilter}
      GROUP BY device ORDER BY cnt DESC
    `, [since, until]);

    // 7. Top 5 Pages
    const topPagesRes = await query(`
      SELECT pv.page_path, MAX(pv.page_title) as page_title, COUNT(*) as views
      FROM page_views pv
      JOIN visitor_sessions vs ON pv.session_id = vs.id
      WHERE vs.session_start >= $1 AND vs.session_start <= $2 ${excludeFilter}
      GROUP BY pv.page_path ORDER BY views DESC LIMIT 5
    `, [since, until]);

    // 8. Top 5 Searches
    const topSearchesRes = await query(`
      SELECT query_text, result_count, COUNT(*) as search_count
      FROM search_queries
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY query_text, result_count ORDER BY search_count DESC LIMIT 5
    `, [since, until]);

    // 9. Top 5 Geographic Locations (Country / City)
    const geoRes = await query(`
      SELECT 
        COALESCE(NULLIF(country, ''), 'India') as country,
        COALESCE(NULLIF(city, ''), 'Kolkata') as city,
        COUNT(*) as cnt
      FROM visitor_sessions
      WHERE session_start >= $1 AND session_start <= $2 ${excludeFilter}
      GROUP BY country, city ORDER BY cnt DESC LIMIT 5
    `, [since, until]);

    // 10. Filtered Bot Hits Count
    const botHitsRes = await query(`SELECT COUNT(*) as cnt FROM bot_hits WHERE created_at >= $1 AND created_at <= $2`, [since, until]);

    const totalBuyClicks = parseInt(buyNowClicksRes.rows[0]?.cnt || 0, 10);
    const priorBuyClicks = parseInt(priorBuyNowRes.rows[0]?.cnt || 0, 10);
    const uniqueBuyClickers = parseInt(uniqueBuyClickersRes.rows[0]?.cnt || 0, 10);
    const uniqueProdVisitors = parseInt(productViewsRes.rows[0]?.cnt || 0, 10);
    const buyNowCtr = uniqueProdVisitors > 0 ? parseFloat(((uniqueBuyClickers / uniqueProdVisitors) * 100).toFixed(1)) : 0;

    const topSourceRow = sourcesRes.rows[0];
    const topSource = topSourceRow ? {
      name: topSourceRow.source,
      share: totalSess > 0 ? Math.round((parseInt(topSourceRow.cnt, 10) / totalSess) * 100) : 0
    } : { name: 'Direct', share: 100 };

    res.json({
      success: true,
      timezone: 'Asia/Kolkata (IST)',
      overview: {
        totalSessions: totalSess,
        sessionsDelta: calcDelta(totalSess, priorSess),
        uniqueVisitors: parseInt(uniqueVisitorsRes.rows[0]?.cnt || 0, 10),
        visitorsDelta: calcDelta(parseInt(uniqueVisitorsRes.rows[0]?.cnt || 0, 10), parseInt(priorVisitorsRes.rows[0]?.cnt || 0, 10)),
        totalPageViews: parseInt(totalPageViewsRes.rows[0]?.cnt || 0, 10),
        pageViewsDelta: calcDelta(parseInt(totalPageViewsRes.rows[0]?.cnt || 0, 10), parseInt(priorViewsRes.rows[0]?.cnt || 0, 10)),
        newVisitors: parseInt(newVisitorsRes.rows[0]?.cnt || 0, 10),
        returningVisitors: parseInt(returningVisitorsRes.rows[0]?.cnt || 0, 10),
        engagedSessions: engagedCount,
        engagementRate,
        engagementRateDelta: calcDelta(engagementRate, priorEngagementRate),
        bounceRate,
        avgSessionDuration: Math.round(parseFloat(avgDurationRes.rows[0]?.avg || 0)),
        durationDelta: calcDelta(Math.round(parseFloat(avgDurationRes.rows[0]?.avg || 0)), Math.round(parseFloat(priorAvgDurationRes.rows[0]?.avg || 0))),
        realTimeActive: parseInt(realtimeRes.rows[0]?.cnt || 0, 10),
        buyNowClicks: totalBuyClicks,
        buyNowClicksDelta: calcDelta(totalBuyClicks, priorBuyClicks),
        buyNowCtr,
        topProduct: topProdRes.rows[0] ? topProdRes.rows[0].name : '—',
        topSource: `${topSource.name} (${topSource.share}%)`,
        trafficSources: sourcesRes.rows,
        deviceDistribution: devicesRes.rows,
        topPages: topPagesRes.rows,
        topSearches: topSearchesRes.rows,
        topGeo: geoRes.rows,
        filteredBotHits: parseInt(botHitsRes.rows[0]?.cnt || 0, 10),
        period: { since, until, timezone: 'Asia/Kolkata (IST)' }
      }
    });
  } catch (err) {
    console.error('[Analytics Overview Error]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Zero-Filled Time-Series Chart (Hourly for Today/Yesterday, Daily for 7d/30d/90d)
// GET /api/analytics/chart?range=7&metric=sessions
// ─────────────────────────────────────────────────────────────────────────────
router.get('/chart', requireAdminAuth, async (req, res) => {
  try {
    const rangeParam = (req.query.range || '7').toString().toLowerCase();
    const { since, until } = getISTDateRange(req.query);
    const excludeFilter = 'AND (is_admin_test IS NULL OR is_admin_test = 0) AND (is_bot IS NULL OR is_bot = 0)';

    const isHourly = (rangeParam === 'today' || rangeParam === 'yesterday');

    if (isHourly) {
      // 24 Hourly Buckets in IST (00:00 to 23:00)
      const hoursMap = {};
      for (let h = 0; h < 24; h++) {
        const hh = String(h).padStart(2, '0') + ':00';
        hoursMap[hh] = { label: hh, sessions: 0, page_views: 0, unique_visitors: 0 };
      }

      const sessionsData = await query(`
        SELECT 
          strftime('%H', datetime(session_start, '+330 minutes')) as hour_str,
          COUNT(*) as sessions,
          COUNT(DISTINCT anonymous_id) as unique_visitors
        FROM visitor_sessions
        WHERE session_start >= $1 AND session_start <= $2 ${excludeFilter}
        GROUP BY hour_str
      `, [since, until]);

      const pageViewsData = await query(`
        SELECT 
          strftime('%H', datetime(pv.viewed_at, '+330 minutes')) as hour_str,
          COUNT(*) as page_views
        FROM page_views pv
        JOIN visitor_sessions vs ON pv.session_id = vs.id
        WHERE vs.session_start >= $1 AND vs.session_start <= $2 ${excludeFilter}
        GROUP BY hour_str
      `, [since, until]);

      sessionsData.rows.forEach(r => {
        const hKey = (r.hour_str ? String(r.hour_str).padStart(2, '0') : '00') + ':00';
        if (hoursMap[hKey]) {
          hoursMap[hKey].sessions = parseInt(r.sessions, 10) || 0;
          hoursMap[hKey].unique_visitors = parseInt(r.unique_visitors, 10) || 0;
        }
      });

      pageViewsData.rows.forEach(r => {
        const hKey = (r.hour_str ? String(r.hour_str).padStart(2, '0') : '00') + ':00';
        if (hoursMap[hKey]) {
          hoursMap[hKey].page_views = parseInt(r.page_views, 10) || 0;
        }
      });

      const buckets = Object.values(hoursMap);
      return res.json({
        success: true,
        bucketType: 'hourly',
        timezone: 'Asia/Kolkata (IST)',
        chart: {
          sessions: buckets.map(b => ({ day: b.label, sessions: b.sessions, unique_visitors: b.unique_visitors })),
          pageViews: buckets.map(b => ({ day: b.label, page_views: b.page_views }))
        }
      });
    }

    // Daily Buckets Zero-Filled in IST (Every single day in range)
    const startDate = new Date(new Date(since).getTime() + IST_OFFSET_MS);
    const endDate = new Date(new Date(until).getTime() + IST_OFFSET_MS);
    const daysMap = {};

    const curr = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
    const endMidnight = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

    while (curr <= endMidnight) {
      const dateKey = curr.toISOString().slice(0, 10);
      daysMap[dateKey] = { label: dateKey, sessions: 0, page_views: 0, unique_visitors: 0 };
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    const sessionsData = await query(`
      SELECT 
        strftime('%Y-%m-%d', datetime(session_start, '+330 minutes')) as day_str,
        COUNT(*) as sessions,
        COUNT(DISTINCT anonymous_id) as unique_visitors
      FROM visitor_sessions
      WHERE session_start >= $1 AND session_start <= $2 ${excludeFilter}
      GROUP BY day_str ORDER BY day_str ASC
    `, [since, until]);

    const pageViewsData = await query(`
      SELECT 
        strftime('%Y-%m-%d', datetime(pv.viewed_at, '+330 minutes')) as day_str,
        COUNT(*) as page_views
      FROM page_views pv
      JOIN visitor_sessions vs ON pv.session_id = vs.id
      WHERE vs.session_start >= $1 AND vs.session_start <= $2 ${excludeFilter}
      GROUP BY day_str ORDER BY day_str ASC
    `, [since, until]);

    sessionsData.rows.forEach(r => {
      if (daysMap[r.day_str]) {
        daysMap[r.day_str].sessions = parseInt(r.sessions, 10) || 0;
        daysMap[r.day_str].unique_visitors = parseInt(r.unique_visitors, 10) || 0;
      }
    });

    pageViewsData.rows.forEach(r => {
      if (daysMap[r.day_str]) {
        daysMap[r.day_str].page_views = parseInt(r.page_views, 10) || 0;
      }
    });

    const buckets = Object.values(daysMap);
    res.json({
      success: true,
      bucketType: 'daily',
      timezone: 'Asia/Kolkata (IST)',
      chart: {
        sessions: buckets.map(b => ({ day: b.label, sessions: b.sessions, unique_visitors: b.unique_visitors })),
        pageViews: buckets.map(b => ({ day: b.label, page_views: b.page_views }))
      }
    });
  } catch (err) {
    console.error('[Analytics Chart Error]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Traffic Source Drill-Down
// GET /api/analytics/traffic-sources/drilldown?channel=Organic+Search&range=30
// ─────────────────────────────────────────────────────────────────────────────
router.get('/traffic-sources/drilldown', requireAdminAuth, async (req, res) => {
  try {
    const { since, until } = getISTDateRange(req.query);
    const channel = (req.query.channel || 'Direct').trim();
    const excludeFilter = 'AND (is_admin_test IS NULL OR is_admin_test = 0) AND (is_bot IS NULL OR is_bot = 0)';

    const details = await query(`
      SELECT 
        COALESCE(NULLIF(referrer, ''), 'Direct') as referrer,
        COALESCE(NULLIF(utm_source, ''), 'none') as utm_source,
        COALESCE(NULLIF(utm_medium, ''), 'none') as utm_medium,
        COALESCE(NULLIF(utm_campaign, ''), 'none') as utm_campaign,
        landing_page,
        COUNT(*) as sessions,
        COUNT(DISTINCT anonymous_id) as visitors
      FROM visitor_sessions
      WHERE session_start >= $1 AND session_start <= $2
        AND channel = $3 ${excludeFilter}
      GROUP BY referrer, utm_source, utm_medium, utm_campaign, landing_page
      ORDER BY sessions DESC
      LIMIT 50
    `, [since, until, channel]);

    res.json({ success: true, channel, details: details.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Excluded IPs Management
// ─────────────────────────────────────────────────────────────────────────────
router.get('/excluded-ips', requireAdminAuth, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM excluded_ips ORDER BY created_at DESC');
    res.json({ success: true, excludedIps: rows.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/excluded-ips', requireAdminAuth, async (req, res) => {
  try {
    const { ipPattern, note } = req.body;
    if (!ipPattern || !ipPattern.trim()) {
      return res.status(400).json({ success: false, error: 'IP pattern is required' });
    }
    const id = randomUUID();
    await query(`
      INSERT INTO excluded_ips (id, ip_pattern, note, created_at)
      VALUES ($1, $2, $3, $4)
    `, [id, ipPattern.trim(), note || '', new Date().toISOString()]);

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/excluded-ips/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM excluded_ips WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Bot Filter Hits & Transparency Stats
// GET /api/analytics/bot-stats
// ─────────────────────────────────────────────────────────────────────────────
router.get('/bot-stats', requireAdminAuth, async (req, res) => {
  try {
    const { since, until } = getISTDateRange(req.query);
    const [countRes, sampleRes] = await Promise.all([
      query('SELECT COUNT(*) as total FROM bot_hits WHERE created_at >= $1 AND created_at <= $2', [since, until]),
      query('SELECT * FROM bot_hits WHERE created_at >= $1 AND created_at <= $2 ORDER BY created_at DESC LIMIT 30', [since, until])
    ]);

    res.json({
      success: true,
      totalBotHits: parseInt(countRes.rows[0]?.total || 0, 10),
      recentBotHits: sampleRes.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Visitor List (Paginated)
// GET /api/analytics/visitors
// ─────────────────────────────────────────────────────────────────────────────
router.get('/visitors', requireAdminAuth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const offset = (page - 1) * limit;
    const dateFrom = req.query.dateFrom || '';
    const dateTo = req.query.dateTo || '';
    const device = req.query.device || '';

    let conditions = ['(is_admin_test IS NULL OR is_admin_test = 0)'];
    let params = [];
    let idx = 1;

    if (dateFrom || dateTo) {
      if (dateFrom) { conditions.push(`session_start >= $${idx++}`); params.push(dateFrom); }
      if (dateTo) { conditions.push(`session_start <= $${idx++}`); params.push(dateTo + 'T23:59:59.999Z'); }
    } else if (req.query.range || req.query.startDate) {
      const { since, until } = getISTDateRange(req.query);
      conditions.push(`session_start >= $${idx++}`); params.push(since);
      conditions.push(`session_start <= $${idx++}`); params.push(until);
    }

    if (device) { conditions.push(`device_type = $${idx++}`); params.push(device); }

    const where = 'WHERE ' + conditions.join(' AND ');

    const [rows, total] = await Promise.all([
      query(`
        SELECT id, anonymous_id, ip_address,
               device_type, browser, os, referrer, channel, utm_source, utm_medium, utm_campaign,
               landing_page, session_start, session_end, last_seen, page_count,
               duration_seconds, active_seconds, is_engaged, is_new_visitor
        FROM visitor_sessions ${where}
        ORDER BY session_start DESC LIMIT $${idx} OFFSET $${idx + 1}
      `, [...params, limit, offset]),
      query(`SELECT COUNT(*) as cnt FROM visitor_sessions ${where}`, params)
    ]);

    res.json({ success: true, visitors: rows.rows, total: parseInt(total.rows[0]?.cnt || 0, 10), page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Visitor Detail
// ─────────────────────────────────────────────────────────────────────────────
router.get('/visitors/:sessionId', requireAdminAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const [session, pages] = await Promise.all([
      query('SELECT * FROM visitor_sessions WHERE id = $1', [sessionId]),
      query('SELECT * FROM page_views WHERE session_id = $1 ORDER BY viewed_at ASC', [sessionId])
    ]);
    if (!session.rows[0]) return res.status(404).json({ success: false, error: 'Session not found' });
    res.json({ success: true, session: session.rows[0], pages: pages.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Real-time Active Visitors (last 120s heartbeat)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/realtime', requireAdminAuth, async (req, res) => {
  try {
    const twoMinAgo = new Date(Date.now() - 120000).toISOString();
    const active = await query(`
      SELECT vs.id, vs.anonymous_id, vs.device_type, vs.browser, vs.session_start, vs.last_seen, vs.active_seconds,
             COALESCE(pv.page_path, vs.landing_page) as page_path,
             COALESCE(pv.page_title, vs.landing_page) as page_title,
             COALESCE(pv.viewed_at, vs.last_seen) as last_page_time
      FROM visitor_sessions vs
      LEFT JOIN page_views pv ON pv.session_id = vs.id
        AND pv.viewed_at = (SELECT MAX(viewed_at) FROM page_views WHERE session_id = vs.id)
      WHERE vs.last_seen >= $1
        AND (vs.is_admin_test IS NULL OR vs.is_admin_test = 0)
        AND (vs.is_bot IS NULL OR vs.is_bot = 0)
      ORDER BY vs.last_seen DESC
      LIMIT 50
    `, [twoMinAgo]);

    res.json({ success: true, activeVisitors: active.rows, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Top Pages Analytics
// ─────────────────────────────────────────────────────────────────────────────
router.get('/top-pages', requireAdminAuth, async (req, res) => {
  try {
    const { since, until } = getISTDateRange(req.query);
    const pageType = (req.query.pageType || 'all').toLowerCase();

    let pathFilter = '';
    if (pageType === 'product' || pageType === 'products') {
      pathFilter = "AND pv.page_path LIKE '/products/%'";
    } else if (pageType === 'tutorial' || pageType === 'tutorials') {
      pathFilter = "AND (pv.page_path LIKE '/tutorials%' OR pv.page_path LIKE '%guide%')";
    } else if (pageType === 'software') {
      pathFilter = "AND pv.page_path LIKE '/software%'";
    } else if (pageType === 'education') {
      pathFilter = "AND pv.page_path LIKE '/education%'";
    }

    const pages = await query(`
      SELECT 
        pv.page_path,
        MAX(pv.page_title) as page_title,
        COUNT(*) as views,
        COUNT(DISTINCT vs.anonymous_id) as unique_visitors,
        AVG(CASE WHEN pv.time_on_page > 0 THEN pv.time_on_page ELSE NULL END) as avg_seconds,
        SUM(CASE WHEN vs.landing_page = pv.page_path THEN 1 ELSE 0 END) as landing_count,
        SUM(CASE WHEN vs.session_end IS NOT NULL AND pv.viewed_at = (
          SELECT MAX(sub.viewed_at) FROM page_views sub WHERE sub.session_id = vs.id
        ) THEN 1 ELSE 0 END) as exit_count
      FROM page_views pv
      JOIN visitor_sessions vs ON pv.session_id = vs.id
      WHERE pv.viewed_at >= $1 AND pv.viewed_at <= $2
        AND (vs.is_admin_test IS NULL OR vs.is_admin_test = 0) ${pathFilter}
      GROUP BY pv.page_path
      ORDER BY views DESC
      LIMIT 100
    `, [since, until]);

    res.json({
      success: true,
      pages: pages.rows.map(p => ({
        ...p,
        views: parseInt(p.views || 0, 10),
        unique_visitors: parseInt(p.unique_visitors || 0, 10),
        avg_seconds: Math.round(parseFloat(p.avg_seconds || 0)),
        landing_count: parseInt(p.landing_count || 0, 10),
        exit_count: parseInt(p.exit_count || 0, 10)
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Product Interest Analytics & Buy Now CTR
// ─────────────────────────────────────────────────────────────────────────────
router.get('/products', requireAdminAuth, async (req, res) => {
  try {
    const { since, until } = getISTDateRange(req.query);

    const allProds = await query('SELECT id, name, sku, series, price, osemi_url FROM products ORDER BY name ASC');

    const pvStats = await query(`
      SELECT 
        pv.page_path,
        COUNT(*) as views,
        COUNT(DISTINCT vs.anonymous_id) as unique_visitors
      FROM page_views pv
      JOIN visitor_sessions vs ON pv.session_id = vs.id
      WHERE pv.viewed_at >= $1 AND pv.viewed_at <= $2
        AND pv.page_path LIKE '/products/%'
        AND (vs.is_admin_test IS NULL OR vs.is_admin_test = 0)
      GROUP BY pv.page_path
    `, [since, until]);

    const evStats = await query(`
      SELECT 
        entity_id,
        event_type,
        COUNT(*) as total_events,
        COUNT(DISTINCT anonymous_id) as unique_users
      FROM analytics_events
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY entity_id, event_type
    `, [since, until]);

    const prodMap = {};
    allProds.rows.forEach(p => {
      prodMap[p.id] = {
        id: p.id,
        name: p.name,
        sku: p.sku || p.id,
        series: p.series || '',
        price: p.price,
        osemi_url: p.osemi_url,
        views: 0,
        unique_visitors: 0,
        buy_now_clicks: 0,
        unique_buy_clickers: 0,
        ctr: 0,
        datasheet_downloads: 0,
        gallery_interactions: 0,
        specs_views: 0
      };
    });

    pvStats.rows.forEach(pv => {
      const parts = pv.page_path.split('/products/');
      if (parts[1]) {
        const prodId = parts[1].split('?')[0].split('/')[0];
        if (prodMap[prodId]) {
          prodMap[prodId].views += parseInt(pv.views || 0, 10);
          prodMap[prodId].unique_visitors += parseInt(pv.unique_visitors || 0, 10);
        } else {
          prodMap[prodId] = {
            id: prodId,
            name: prodId,
            sku: prodId,
            series: '',
            price: 0,
            views: parseInt(pv.views || 0, 10),
            unique_visitors: parseInt(pv.unique_visitors || 0, 10),
            buy_now_clicks: 0,
            unique_buy_clickers: 0,
            ctr: 0,
            datasheet_downloads: 0,
            gallery_interactions: 0,
            specs_views: 0
          };
        }
      }
    });

    evStats.rows.forEach(ev => {
      const pid = ev.entity_id;
      if (pid && prodMap[pid]) {
        if (ev.event_type === 'buy_now_click') {
          prodMap[pid].buy_now_clicks += parseInt(ev.total_events || 0, 10);
          prodMap[pid].unique_buy_clickers += parseInt(ev.unique_users || 0, 10);
        } else if (ev.event_type === 'document_download') {
          prodMap[pid].datasheet_downloads += parseInt(ev.total_events || 0, 10);
        } else if (ev.event_type === 'gallery_interaction') {
          prodMap[pid].gallery_interactions += parseInt(ev.total_events || 0, 10);
        } else if (ev.event_type === 'specs_interaction') {
          prodMap[pid].specs_views += parseInt(ev.total_events || 0, 10);
        }
      }
    });

    const list = Object.values(prodMap).map(p => {
      const ctr = p.unique_visitors > 0
        ? parseFloat(((p.unique_buy_clickers / p.unique_visitors) * 100).toFixed(1))
        : (p.buy_now_clicks > 0 ? 100 : 0);
      return { ...p, ctr };
    });

    list.sort((a, b) => (b.views + b.buy_now_clicks) - (a.views + a.buy_now_clicks));

    res.json({ success: true, products: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: External Purchase Clicks Log
// ─────────────────────────────────────────────────────────────────────────────
router.get('/external-clicks', requireAdminAuth, async (req, res) => {
  try {
    const { since, until } = getISTDateRange(req.query);

    const clicks = await query(`
      SELECT 
        ae.id,
        ae.entity_id as product_id,
        ae.entity_title as product_name,
        ae.created_at,
        ae.page_path as source_page,
        ae.metadata,
        vs.device_type,
        vs.browser,
        vs.os,
        vs.referrer,
        vs.channel,
        vs.utm_source,
        vs.utm_medium,
        vs.utm_campaign,
        ae.anonymous_id
      FROM analytics_events ae
      LEFT JOIN visitor_sessions vs ON ae.session_id = vs.id
      WHERE ae.event_type = 'buy_now_click'
        AND ae.created_at >= $1 AND ae.created_at <= $2
        AND (vs.is_admin_test IS NULL OR vs.is_admin_test = 0)
      ORDER BY ae.created_at DESC
      LIMIT 200
    `, [since, until]);

    const totalClicks = clicks.rows.length;
    const uniqueClickers = new Set(clicks.rows.map(c => c.anonymous_id)).size;

    res.json({
      success: true,
      totalClicks,
      uniqueClickers,
      clicks: clicks.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Video Engagement Analytics
// ─────────────────────────────────────────────────────────────────────────────
router.get('/videos', requireAdminAuth, async (req, res) => {
  try {
    const { since, until } = getISTDateRange(req.query);

    const stats = await query(`
      SELECT 
        entity_id,
        entity_title,
        SUM(CASE WHEN event_type = 'video_impression' THEN 1 ELSE 0 END) as impressions,
        SUM(CASE WHEN event_type = 'video_play' THEN 1 ELSE 0 END) as plays,
        COUNT(DISTINCT CASE WHEN event_type = 'video_play' THEN anonymous_id END) as unique_viewers,
        SUM(CASE WHEN event_type = 'video_progress_25' THEN 1 ELSE 0 END) as progress_25,
        SUM(CASE WHEN event_type = 'video_progress_50' THEN 1 ELSE 0 END) as progress_50,
        SUM(CASE WHEN event_type = 'video_progress_75' THEN 1 ELSE 0 END) as progress_75,
        SUM(CASE WHEN event_type = 'video_complete_100' THEN 1 ELSE 0 END) as complete_100
      FROM analytics_events
      WHERE (event_type LIKE 'video_%')
        AND created_at >= $1 AND created_at <= $2
      GROUP BY entity_id, entity_title
      ORDER BY plays DESC
    `, [since, until]);

    res.json({
      success: true,
      videos: stats.rows.map(v => {
        const plays = parseInt(v.plays || 0, 10);
        const comp = parseInt(v.complete_100 || 0, 10);
        const completionRate = plays > 0 ? Math.round((comp / plays) * 100) : 0;
        return {
          ...v,
          impressions: parseInt(v.impressions || 0, 10),
          plays,
          unique_viewers: parseInt(v.unique_viewers || 0, 10),
          progress_25: parseInt(v.progress_25 || 0, 10),
          progress_50: parseInt(v.progress_50 || 0, 10),
          progress_75: parseInt(v.progress_75 || 0, 10),
          complete_100: comp,
          completionRate
        };
      })
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Tutorial & Guide Analytics
// ─────────────────────────────────────────────────────────────────────────────
router.get('/tutorials', requireAdminAuth, async (req, res) => {
  try {
    const { since, until } = getISTDateRange(req.query);

    const tutViews = await query(`
      SELECT 
        pv.page_path,
        MAX(pv.page_title) as title,
        COUNT(*) as views,
        COUNT(DISTINCT vs.anonymous_id) as unique_readers,
        AVG(CASE WHEN pv.time_on_page > 0 THEN pv.time_on_page ELSE NULL END) as avg_seconds
      FROM page_views pv
      JOIN visitor_sessions vs ON pv.session_id = vs.id
      WHERE pv.viewed_at >= $1 AND pv.viewed_at <= $2
        AND (pv.page_path LIKE '/tutorials%' OR pv.page_path LIKE '%guide%')
        AND (vs.is_admin_test IS NULL OR vs.is_admin_test = 0)
      GROUP BY pv.page_path
      ORDER BY views DESC
    `, [since, until]);

    const downloads = await query(`
      SELECT 
        entity_id,
        entity_title,
        COUNT(*) as downloads,
        COUNT(DISTINCT anonymous_id) as unique_downloaders
      FROM analytics_events
      WHERE event_type = 'document_download'
        AND created_at >= $1 AND created_at <= $2
      GROUP BY entity_id, entity_title
      ORDER BY downloads DESC
    `, [since, until]);

    res.json({
      success: true,
      tutorials: tutViews.rows.map(t => ({
        ...t,
        views: parseInt(t.views || 0, 10),
        unique_readers: parseInt(t.unique_readers || 0, 10),
        avg_seconds: Math.round(parseFloat(t.avg_seconds || 0))
      })),
      downloads: downloads.rows.map(d => ({
        ...d,
        downloads: parseInt(d.downloads || 0, 10),
        unique_downloaders: parseInt(d.unique_downloaders || 0, 10)
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Internal Search Analytics
// ─────────────────────────────────────────────────────────────────────────────
router.get('/searches', requireAdminAuth, async (req, res) => {
  try {
    const { since, until } = getISTDateRange(req.query);

    const topSearches = await query(`
      SELECT 
        query_text,
        COUNT(*) as search_count,
        AVG(result_count) as avg_results,
        COUNT(DISTINCT anonymous_id) as unique_searchers,
        SUM(CASE WHEN clicked_entity_id != '' THEN 1 ELSE 0 END) as clicks
      FROM search_queries
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY query_text
      ORDER BY search_count DESC
      LIMIT 50
    `, [since, until]);

    const failedSearches = await query(`
      SELECT 
        query_text,
        COUNT(*) as attempt_count,
        MAX(created_at) as last_attempted
      FROM search_queries
      WHERE result_count = 0
        AND created_at >= $1 AND created_at <= $2
      GROUP BY query_text
      ORDER BY attempt_count DESC
      LIMIT 50
    `, [since, until]);

    res.json({
      success: true,
      topSearches: topSearches.rows.map(s => ({
        ...s,
        search_count: parseInt(s.search_count || 0, 10),
        avg_results: Math.round(parseFloat(s.avg_results || 0)),
        unique_searchers: parseInt(s.unique_searchers || 0, 10),
        clicks: parseInt(s.clicks || 0, 10)
      })),
      failedSearches: failedSearches.rows.map(f => ({
        ...f,
        attempt_count: parseInt(f.attempt_count || 0, 10)
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Visitor Journey Flow
// ─────────────────────────────────────────────────────────────────────────────
router.get('/journeys', requireAdminAuth, async (req, res) => {
  try {
    const { since, until } = getISTDateRange(req.query);
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);

    const sessions = await query(`
      SELECT 
        id, anonymous_id, landing_page, session_start, session_end,
        device_type, browser, os, duration_seconds, active_seconds, page_count,
        referrer, channel, utm_source, utm_campaign, is_engaged
      FROM visitor_sessions
      WHERE session_start >= $1 AND session_start <= $2
        AND (is_admin_test IS NULL OR is_admin_test = 0)
      ORDER BY session_start DESC
      LIMIT $3
    `, [since, until, limit]);

    const sessionIds = sessions.rows.map(s => s.id);
    let allSteps = [];
    if (sessionIds.length > 0) {
      const placeholders = sessionIds.map((_, i) => `$${i + 1}`).join(',');
      const [pvs, evs] = await Promise.all([
        query(`
          SELECT session_id, page_path, page_title, viewed_at as step_time, 'page_view' as step_type, time_on_page
          FROM page_views
          WHERE session_id IN (${placeholders})
          ORDER BY viewed_at ASC
        `, sessionIds),
        query(`
          SELECT session_id, event_type as step_type, entity_id, entity_title, page_path, created_at as step_time, metadata
          FROM analytics_events
          WHERE session_id IN (${placeholders})
          ORDER BY created_at ASC
        `, sessionIds)
      ]);

      allSteps = [...pvs.rows, ...evs.rows].sort((a, b) => new Date(a.step_time) - new Date(b.step_time));
    }

    const journeys = sessions.rows.map(s => {
      const steps = allSteps.filter(st => st.session_id === s.id);
      return {
        ...s,
        steps: steps.map(st => ({
          type: st.step_type,
          path: st.page_path,
          title: st.page_title || st.entity_title || st.entity_id || '',
          time: st.step_time,
          duration: st.time_on_page || 0
        }))
      };
    });

    res.json({ success: true, journeys });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Live Activity Feed (last 50 discrete events)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/live-feed', requireAdminAuth, async (req, res) => {
  try {
    const recent = await query(`
      SELECT 
        ae.id,
        ae.event_type,
        ae.entity_title,
        ae.entity_id,
        ae.page_path,
        ae.created_at,
        vs.anonymous_id,
        vs.device_type,
        vs.browser,
        vs.channel
      FROM analytics_events ae
      LEFT JOIN visitor_sessions vs ON ae.session_id = vs.id
      ORDER BY ae.created_at DESC
      LIMIT 50
    `);

    res.json({ success: true, feed: recent.rows, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Comprehensive Daily Report (JSON and CSV)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/daily-report', requireAdminAuth, async (req, res) => {
  try {
    const { since, until } = getISTDateRange(req.query);
    const excludeFilter = 'AND (is_admin_test IS NULL OR is_admin_test = 0) AND (is_bot IS NULL OR is_bot = 0)';

    const [sessions, views, engaged, buyClicks, uniqueClickers, downloads] = await Promise.all([
      query(`SELECT COUNT(*) as cnt, COUNT(DISTINCT anonymous_id) as uniques, AVG(active_seconds) as avg_duration FROM visitor_sessions WHERE session_start >= $1 AND session_start <= $2 ${excludeFilter}`, [since, until]),
      query(`SELECT COUNT(*) as cnt FROM page_views pv JOIN visitor_sessions vs ON pv.session_id = vs.id WHERE vs.session_start >= $1 AND vs.session_start <= $2 ${excludeFilter}`, [since, until]),
      query(`SELECT COUNT(*) as cnt FROM visitor_sessions WHERE session_start >= $1 AND session_start <= $2 AND is_engaged = 1 ${excludeFilter}`, [since, until]),
      query(`SELECT COUNT(*) as cnt FROM analytics_events WHERE event_type = 'buy_now_click' AND created_at >= $1 AND created_at <= $2`, [since, until]),
      query(`SELECT COUNT(DISTINCT anonymous_id) as cnt FROM analytics_events WHERE event_type = 'buy_now_click' AND created_at >= $1 AND created_at <= $2`, [since, until]),
      query(`SELECT COUNT(*) as cnt FROM analytics_events WHERE event_type = 'document_download' AND created_at >= $1 AND created_at <= $2`, [since, until])
    ]);

    const totalSessions = parseInt(sessions.rows[0]?.cnt || 0, 10);
    const uniqueVisitors = parseInt(sessions.rows[0]?.uniques || 0, 10);
    const totalViews = parseInt(views.rows[0]?.cnt || 0, 10);
    const engagedCount = parseInt(engaged.rows[0]?.cnt || 0, 10);
    const engagementRate = totalSessions > 0 ? ((engagedCount / totalSessions) * 100).toFixed(1) : '0.0';
    const bounceRate = totalSessions > 0 ? (100 - parseFloat(engagementRate)).toFixed(1) : '0.0';
    const avgDuration = Math.round(parseFloat(sessions.rows[0]?.avg_duration || 0));
    const totalBuyClicks = parseInt(buyClicks.rows[0]?.cnt || 0, 10);
    const uniqueBuyers = parseInt(uniqueClickers.rows[0]?.cnt || 0, 10);
    const totalDownloads = parseInt(downloads.rows[0]?.cnt || 0, 10);
    const overallCtr = uniqueVisitors > 0 ? ((uniqueBuyers / uniqueVisitors) * 100).toFixed(2) : '0.00';

    const report = {
      generatedAt: formatIST(new Date()),
      period: { since: formatIST(since), until: formatIST(until) },
      metrics: {
        totalSessions,
        uniqueVisitors,
        totalPageViews: totalViews,
        engagedSessions: engagedCount,
        engagementRate: `${engagementRate}%`,
        bounceRate: `${bounceRate}%`,
        averageActiveDuration: `${avgDuration}s`,
        totalBuyNowClicks: totalBuyClicks,
        uniqueBuyNowClickers: uniqueBuyers,
        purchaseClickThroughRate: `${overallCtr}%`,
        datasheetDownloads: totalDownloads
      }
    };

    if (req.query.format === 'csv') {
      const csv = `Metric,Value\nTotal Sessions,${totalSessions}\nUnique Visitors,${uniqueVisitors}\nTotal Page Views,${totalViews}\nEngaged Sessions,${engagedCount}\nEngagement Rate,${engagementRate}%\nBounce Rate,${bounceRate}%\nAverage Active Duration,${avgDuration}s\nBuy Now Clicks,${totalBuyClicks}\nUnique Buy Clickers,${uniqueBuyers}\nPurchase CTR,${overallCtr}%\nDatasheet Downloads,${totalDownloads}\nPeriod Start (IST),${formatIST(since)}\nPeriod End (IST),${formatIST(until)}\n`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="oxybott-analytics-report-${new Date().toISOString().slice(0,10)}.csv"`);
      return res.send(csv);
    }

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Export Raw Visitor Sessions CSV
// ─────────────────────────────────────────────────────────────────────────────
router.get('/export', requireAdminAuth, async (req, res) => {
  try {
    const { since, until } = getISTDateRange(req.query);
    const excludeFilter = 'AND (is_admin_test IS NULL OR is_admin_test = 0) AND (is_bot IS NULL OR is_bot = 0)';

    const data = await query(`
      SELECT anonymous_id, session_start, session_end, last_seen, ip_address, device_type, browser, os,
             referrer, channel, utm_source, utm_medium, utm_campaign, landing_page, page_count,
             duration_seconds, active_seconds, is_engaged, is_new_visitor
      FROM visitor_sessions 
      WHERE session_start >= $1 AND session_start <= $2 ${excludeFilter}
      ORDER BY session_start DESC
    `, [since, until]);

    const headers = [
      'Visitor ID', 'Session Start (IST)', 'Session End (IST)', 'Last Seen (IST)',
      'IP (Masked)', 'Device', 'Browser', 'OS', 'Channel', 'Referrer',
      'UTM Source', 'UTM Medium', 'UTM Campaign', 'Landing Page', 'Page Count',
      'Active Time (s)', 'Engaged Session', 'New Visitor'
    ];

    const csvRows = data.rows.map(r => [
      r.anonymous_id?.substring(0, 10) + '...',
      formatIST(r.session_start),
      formatIST(r.session_end),
      formatIST(r.last_seen),
      r.ip_address || '—',
      r.device_type,
      r.browser,
      r.os,
      r.channel || 'Direct',
      r.referrer || 'Direct',
      r.utm_source || '',
      r.utm_medium || '',
      r.utm_campaign || '',
      r.landing_page,
      r.page_count,
      r.active_seconds || r.duration_seconds || 0,
      r.is_engaged ? 'Yes' : 'No',
      r.is_new_visitor ? 'Yes' : 'No'
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...csvRows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-visitors-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
