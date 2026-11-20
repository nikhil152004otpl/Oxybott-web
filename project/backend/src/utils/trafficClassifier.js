/**
 * Traffic Classification, Bot Detection & Privacy Helpers
 */
const crypto = require('crypto');

// ─── Salted Daily IP Hashing & Masking ───────────────────────────────────────
function getDailySalt() {
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseSecret = process.env.ANALYTICS_SALT || process.env.JWT_SECRET || 'oxybott-analytics-salt-seed';
  return crypto.createHmac('sha256', baseSecret).update(dateStr).digest('hex');
}

function hashIp(rawIp) {
  if (!rawIp) return '';
  const cleanIp = String(rawIp).split(',')[0].trim();
  const salt = getDailySalt();
  return crypto.createHmac('sha256', salt).update(cleanIp).digest('hex').substring(0, 24);
}

function maskIp(rawIp) {
  if (!rawIp) return '—';
  const clean = String(rawIp).split(',')[0].trim();
  if (clean.includes('.')) {
    const parts = clean.split('.');
    return parts.slice(0, 2).join('.') + '.*.*';
  }
  if (clean.includes(':')) {
    const parts = clean.split(':');
    return parts.slice(0, 2).join(':') + ':*:*:*:*';
  }
  return '—';
}

// ─── Bot Detection ───────────────────────────────────────────────────────────
const BOT_PATTERNS = [
  /bot\b/i, /crawler\b/i, /spider\b/i, /crawling\b/i, /slurp\b/i,
  /googlebot/i, /bingbot/i, /yandex/i, /duckduckbot/i, /baiduspider/i,
  /ahrefsbot/i, /semrushbot/i, /mj12bot/i, /dotbot/i, /rogerbot/i,
  /headlesschrome/i, /phantomjs/i, /selenium/i, /puppeteer/i, /playwright/i,
  /curl\//i, /wget\//i, /python-requests/i, /postman/i, /httpclient/i, /go-http-client/i,
  /node-fetch/i, /axios\//i, /undici/i, /got\//i
];

function isBot(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') return true;
  const ua = userAgent.trim();
  if (ua.length < 10) return true;
  return BOT_PATTERNS.some(regex => regex.test(ua));
}

// ─── Traffic Source Classifier ───────────────────────────────────────────────
function classifyTrafficSource(referrer = '', utmSource = '', utmMedium = '', utmCampaign = '', currentHost = '') {
  const ref = (referrer || '').toLowerCase().trim();
  const medium = (utmMedium || '').toLowerCase().trim();
  const source = (utmSource || '').toLowerCase().trim();

  // 1. Paid Advertising (via UTM)
  if (['cpc', 'paid', 'ppc', 'paidsocial', 'display', 'adwords', 'ads'].includes(medium)) {
    return { channel: 'Paid', detail: source ? `${source} (paid)` : 'Paid Ad' };
  }

  // 2. Email Marketing
  if (medium === 'email' || source === 'email' || source === 'newsletter') {
    return { channel: 'Email', detail: source || 'Email' };
  }

  // 3. Special External Partner: osemi.in
  if (ref.includes('osemi.in') || source === 'osemi' || source === 'osemi.in') {
    return { channel: 'osemi.in', detail: 'osemi.in' };
  }

  // 4. Internal Self-Referrals
  if (ref) {
    try {
      const parsedRef = new URL(ref);
      const refHost = parsedRef.hostname.toLowerCase();
      if (
        refHost === 'localhost' ||
        refHost === '127.0.0.1' ||
        refHost.includes('oxybott.com') ||
        (currentHost && refHost.includes(currentHost))
      ) {
        return { channel: 'Internal', detail: refHost };
      }
    } catch {}
  }

  // 5. Direct (no referrer and no UTM)
  if (!ref && !source) {
    return { channel: 'Direct', detail: 'Direct / Bookmark' };
  }

  // 6. Organic Search
  const searchEngines = [
    { name: 'Google', pattern: /google\./ },
    { name: 'Bing', pattern: /bing\./ },
    { name: 'Yahoo', pattern: /yahoo\./ },
    { name: 'DuckDuckGo', pattern: /duckduckgo\./ },
    { name: 'Baidu', pattern: /baidu\./ },
    { name: 'Yandex', pattern: /yandex\./ },
    { name: 'Ecosia', pattern: /ecosia\./ }
  ];
  for (const se of searchEngines) {
    if (se.pattern.test(ref) || source === se.name.toLowerCase()) {
      return { channel: 'Organic Search', detail: se.name };
    }
  }

  // 7. Social Media
  const socialNetworks = [
    { name: 'Facebook', pattern: /facebook\.|fb\.com|m\.me/ },
    { name: 'Instagram', pattern: /instagram\./ },
    { name: 'Twitter/X', pattern: /twitter\.|x\.com|t\.co/ },
    { name: 'LinkedIn', pattern: /linkedin\.|lnkd\.in/ },
    { name: 'YouTube', pattern: /youtube\.|youtu\.be/ },
    { name: 'Reddit', pattern: /reddit\./ },
    { name: 'Pinterest', pattern: /pinterest\./ },
    { name: 'WhatsApp', pattern: /whatsapp\.|wa\.me/ },
    { name: 'Telegram', pattern: /t\.me|telegram\./ }
  ];
  for (const sn of socialNetworks) {
    if (sn.pattern.test(ref) || source === sn.name.toLowerCase() || medium === 'social') {
      return { channel: 'Social', detail: sn.name };
    }
  }

  // 8. Other External Referral
  if (ref) {
    try {
      const parsed = new URL(ref);
      return { channel: 'Referral', detail: parsed.hostname };
    } catch {
      return { channel: 'Referral', detail: ref };
    }
  }

  if (source) {
    return { channel: 'Referral', detail: source };
  }

  return { channel: 'Direct', detail: 'Direct' };
}

// ─── Format Date in IST ──────────────────────────────────────────────────────
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function formatIST(dateObjOrIso) {
  if (!dateObjOrIso) return '—';
  const d = new Date(new Date(dateObjOrIso).getTime() + IST_OFFSET_MS);
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' IST';
}

module.exports = {
  hashIp,
  maskIp,
  isBot,
  classifyTrafficSource,
  formatIST,
  IST_OFFSET_MS
};
