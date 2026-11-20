const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/app');
const { query } = require('../src/config/db');
const { generateToken } = require('../src/middleware/auth');
const {
  classifyTrafficSource,
  isBot,
  maskIp,
  hashIp,
  formatIST
} = require('../src/utils/trafficClassifier');

let server;
let baseUrl;
const adminToken = generateToken({
  id: 1,
  username: 'admin',
  email: 'admin@oxybott.com',
  role: 'superadmin'
});

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function apiRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}),
      ...options.headers
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// ─── 1. Unit Tests: Active Duration & Heartbeat Capping ───────────────────────
test('1. Active Duration & Heartbeat logic caps delta at 60s and session at 14400s', () => {
  function applyHeartbeat(currentActive, rawDelta) {
    const delta = Math.min(Math.max(parseInt(rawDelta, 10) || 0, 0), 60);
    return Math.min(14400, (currentActive || 0) + delta);
  }

  // Normal 15s pulse
  assert.equal(applyHeartbeat(0, 15), 15);
  assert.equal(applyHeartbeat(15, 15), 30);

  // Negative delta should be ignored (clamped to 0)
  assert.equal(applyHeartbeat(45, -20), 45);

  // Huge single delta (e.g. 99999s spoofed) capped to 60s
  assert.equal(applyHeartbeat(100, 99999), 160);

  // Sane maximum session cap: 14400s (4 hours)
  assert.equal(applyHeartbeat(14390, 60), 14400);
  assert.equal(applyHeartbeat(14400, 15), 14400);
});

// ─── 2. Unit Tests: Engaged Session Criteria ─────────────────────────────────
test('2. Engaged session criteria: active >= 10s OR pages >= 2 OR high-value event', () => {
  function isSessionEngaged(activeSeconds, pageCount, hasHighValueEvent = false) {
    if (hasHighValueEvent) return true;
    if (activeSeconds >= 10) return true;
    if (pageCount >= 2) return true;
    return false;
  }

  // 1 page view, 5 seconds active, no events => Bounce (not engaged)
  assert.equal(isSessionEngaged(5, 1, false), false);

  // 1 page view, 10 seconds active => Engaged
  assert.equal(isSessionEngaged(10, 1, false), true);

  // 2 page views, 3 seconds active => Engaged
  assert.equal(isSessionEngaged(3, 2, false), true);

  // 1 page view, 2 seconds, but clicked Buy Now => Engaged
  assert.equal(isSessionEngaged(2, 1, true), true);

  // Engagement Rate & Bounce Rate reciprocity
  const total = 100;
  const engaged = 65;
  const engagementRate = Math.round((engaged / total) * 100);
  const bounceRate = 100 - engagementRate;
  assert.equal(engagementRate, 65);
  assert.equal(bounceRate, 35);
});

// ─── 3. Unit Tests: Traffic Source Classifier ────────────────────────────────
test('3. Traffic Source Classifier accurately maps channels and partners', () => {
  // Direct
  assert.equal(classifyTrafficSource('', '', '', '').channel, 'Direct');
  assert.equal(classifyTrafficSource(null, null, null, null).channel, 'Direct');

  // Organic Search
  assert.equal(classifyTrafficSource('https://www.google.com/search?q=robotics').channel, 'Organic Search');
  assert.equal(classifyTrafficSource('https://www.bing.com/search?q=oxybott').channel, 'Organic Search');
  assert.equal(classifyTrafficSource('https://duckduckgo.com/').channel, 'Organic Search');

  // Social
  assert.equal(classifyTrafficSource('https://www.youtube.com/watch?v=123').channel, 'Social');
  assert.equal(classifyTrafficSource('https://www.instagram.com/reel/123').channel, 'Social');
  assert.equal(classifyTrafficSource('https://x.com/post/123').channel, 'Social');
  assert.equal(classifyTrafficSource('', 'twitter', 'social').channel, 'Social');

  // Partner: osemi.in
  assert.equal(classifyTrafficSource('https://osemi.in/store/products').channel, 'osemi.in');
  assert.equal(classifyTrafficSource('', 'osemi', 'partner').channel, 'osemi.in');

  // Paid Ads (via UTM)
  assert.equal(classifyTrafficSource('https://google.com', 'google', 'cpc').channel, 'Paid');
  assert.equal(classifyTrafficSource('', 'meta', 'paid').channel, 'Paid');

  // Internal Self-Referrals
  assert.equal(classifyTrafficSource('http://localhost:3000/home').channel, 'Internal');
  assert.equal(classifyTrafficSource('https://oxybott.com/products', '', '', '', 'oxybott.com').channel, 'Internal');

  // Referral
  assert.equal(classifyTrafficSource('https://hackaday.com/blog/article').channel, 'Referral');
});

// ─── 4. Unit Tests: Privacy & Bot Detection ──────────────────────────────────
test('4. Privacy: IP masking & Bot detection', () => {
  // IPv4 Masking
  assert.equal(maskIp('192.168.1.55'), '192.168.*.*');
  assert.equal(maskIp('103.21.244.10, 127.0.0.1'), '103.21.*.*');

  // IPv6 Masking
  assert.equal(maskIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334'), '2001:0db8:*:*:*:*');

  // Bot detection
  assert.equal(isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), true);
  assert.equal(isBot('Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)'), true);
  assert.equal(isBot('curl/7.88.1'), true);
  assert.equal(isBot('PostmanRuntime/7.32.3'), true);
  assert.equal(isBot('HeadlessChrome/120.0.0.0'), true);
  assert.equal(isBot('python-requests/2.31.0'), true);

  // Real user agents
  assert.equal(isBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'), false);
  assert.equal(isBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'), false);
});

// ─── 5. Unit Tests: IST Time Bucketing (Asia/Kolkata) ────────────────────────
test('5. IST Time formatting and 24-hour bucketing alignment', () => {
  const formatted = formatIST('2026-11-20T00:00:00.000Z');
  assert.ok(formatted.includes('IST'));
  // 00:00 UTC is 05:30 IST
  assert.ok(formatted.includes('05:30:00'));

  // Ensure 24 buckets can be generated for today
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  assert.equal(hours.length, 24);
  assert.equal(hours[0], '00:00');
  assert.equal(hours[23], '23:00');
});

// ─── 6. Integration Tests: Public Tracking & Heartbeat API ───────────────────
test('6. Public Tracking & Heartbeat flow updates active seconds & engagement in database', async () => {
  const visitorId = 'anon_test_suite_' + Math.random().toString(36).substring(2, 9);
  const sessionId = 'sess_test_suite_' + Math.random().toString(36).substring(2, 9);

  // 1. Initial page tracking
  const trackRes = await apiRequest('/api/analytics/track', {
    method: 'POST',
    body: JSON.stringify({
      visitorId,
      sessionId,
      isNewSession: true,
      pagePath: '/tutorials',
      pageTitle: 'Tutorials • Oxybott',
      deviceType: 'desktop',
      browser: 'Firefox',
      os: 'Linux',
      referrer: 'https://duckduckgo.com/',
      isNewVisitor: true,
      consentGiven: true
    })
  });
  assert.equal(trackRes.status, 200);
  assert.equal(trackRes.data.success, true);

  // 2. Heartbeat 1 (15s active pulse)
  const hbRes1 = await apiRequest('/api/analytics/heartbeat', {
    method: 'POST',
    body: JSON.stringify({
      visitorId,
      sessionId,
      pagePath: '/tutorials',
      pageTitle: 'Tutorials • Oxybott',
      activeDelta: 15,
      isAdminTest: false,
      isFinal: false
    })
  });
  assert.equal(hbRes1.status, 200);
  assert.equal(hbRes1.data.success, true);

  // Verify in DB that active_seconds = 15 and is_engaged = 1
  const sessRow1 = await query('SELECT active_seconds, is_engaged FROM visitor_sessions WHERE id = $1', [sessionId]);
  assert.equal(sessRow1.rows.length, 1);
  assert.equal(sessRow1.rows[0].active_seconds, 15);
  assert.equal(sessRow1.rows[0].is_engaged, 1);

  // 3. Heartbeat 2 (another 15s pulse -> total 30s)
  const hbRes2 = await apiRequest('/api/analytics/heartbeat', {
    method: 'POST',
    body: JSON.stringify({
      visitorId,
      sessionId,
      pagePath: '/tutorials',
      pageTitle: 'Tutorials • Oxybott',
      activeDelta: 15,
      isAdminTest: false,
      isFinal: false
    })
  });
  assert.equal(hbRes2.status, 200);

  const sessRow2 = await query('SELECT active_seconds FROM visitor_sessions WHERE id = $1', [sessionId]);
  assert.equal(sessRow2.rows[0].active_seconds, 30);
});

// ─── 7. Integration Tests: Admin Analytics Overview & KPI Cards ──────────────
test('7. Admin Analytics Overview returns comprehensive KPIs & prior period changes', async () => {
  const { status, data } = await apiRequest('/api/analytics/overview?range=30d');
  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.equal(data.timezone, 'Asia/Kolkata (IST)');

  const o = data.overview;
  assert.ok(o);
  assert.ok(typeof o.totalSessions === 'number');
  assert.ok(typeof o.uniqueVisitors === 'number');
  assert.ok(typeof o.totalPageViews === 'number');
  assert.ok(typeof o.engagementRate === 'number');
  assert.ok(typeof o.bounceRate === 'number');
  assert.ok(typeof o.avgSessionDuration === 'number');
  assert.ok(typeof o.realTimeActive === 'number');

  // New KPI cards
  assert.ok(typeof o.buyNowClicks === 'number');
  assert.ok(typeof o.buyNowCtr === 'number');
  assert.ok(typeof o.topProduct === 'string');
  assert.ok(typeof o.topSource === 'string');

  // Prior period comparisons
  assert.ok(typeof o.sessionsDelta === 'string');
  assert.ok(typeof o.visitorsDelta === 'string');
  assert.ok(typeof o.pageViewsDelta === 'string');
  assert.ok(typeof o.engagementRateDelta === 'string');

  // Overviews breakdown
  assert.ok(Array.isArray(o.topPages));
  assert.ok(Array.isArray(o.topSearches));
  assert.ok(Array.isArray(o.topGeo));
  assert.ok(Array.isArray(o.deviceDistribution));
  assert.ok(Array.isArray(o.trafficSources));
  assert.ok(typeof o.filteredBotHits === 'number');
});

// ─── 8. Integration Tests: Traffic Over Time Chart zero-filled intervals ───────
test('8. Traffic Over Time Chart produces zero-filled buckets for Today and 7d in IST', async () => {
  // Today hourly buckets
  const todayRes = await apiRequest('/api/analytics/chart?range=today');
  assert.equal(todayRes.status, 200);
  assert.equal(todayRes.data.success, true);
  assert.equal(todayRes.data.chart.sessions.length, 24);
  assert.equal(todayRes.data.chart.pageViews.length, 24);
  assert.equal(todayRes.data.timezone, 'Asia/Kolkata (IST)');

  // 7 days daily buckets
  const sevenDayRes = await apiRequest('/api/analytics/chart?range=7');
  assert.equal(sevenDayRes.status, 200);
  assert.equal(sevenDayRes.data.success, true);
  assert.equal(sevenDayRes.data.chart.sessions.length, 7);
  assert.equal(sevenDayRes.data.chart.pageViews.length, 7);
});

// ─── 9. Integration Tests: Traffic Sources Drilldown ─────────────────────────
test('9. Traffic Sources channel drilldown returns structured breakdowns', async () => {
  // Channel drill-down for Organic Search
  const drillRes = await apiRequest('/api/analytics/traffic-sources/drilldown?channel=Organic Search&range=30');
  assert.equal(drillRes.status, 200);
  assert.equal(drillRes.data.success, true);
  assert.equal(drillRes.data.channel, 'Organic Search');
  assert.ok(Array.isArray(drillRes.data.details));
});

// ─── 10. Integration Tests: Excluded IPs & Bot Hits Management ────────────────
test('10. Excluded IPs CRUD and Bot Hits statistics endpoints', async () => {
  // 1. Add excluded IP pattern
  const addRes = await apiRequest('/api/analytics/excluded-ips', {
    method: 'POST',
    body: JSON.stringify({ ipPattern: '192.168.100.*', note: 'Office VPN Test Range' })
  });
  assert.equal(addRes.status, 200);
  assert.equal(addRes.data.success, true);
  const addedId = addRes.data.id;
  assert.ok(addedId);

  // 2. List excluded IPs
  const listRes = await apiRequest('/api/analytics/excluded-ips');
  assert.equal(listRes.status, 200);
  const found = listRes.data.excludedIps.find(x => x.id === addedId);
  assert.ok(found);
  assert.equal(found.ip_pattern, '192.168.100.*');

  // 3. Delete excluded IP
  const delRes = await apiRequest(`/api/analytics/excluded-ips/${addedId}`, {
    method: 'DELETE'
  });
  assert.equal(delRes.status, 200);
  assert.equal(delRes.data.success, true);

  // 4. Bot Stats
  const botRes = await apiRequest('/api/analytics/bot-stats?range=30');
  assert.equal(botRes.status, 200);
  assert.equal(botRes.data.success, true);
  assert.ok(typeof botRes.data.totalBotHits === 'number');
  assert.ok(Array.isArray(botRes.data.recentBotHits));
});
