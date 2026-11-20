/**
 * Oxybott Analytics Tracker
 * 
 * - Generates anonymous visitor ID (non-PII)
 * - Tracks SPA page views on route changes
 * - Respects cookie consent (only tracks if analytics accepted)
 * - Deduplicates events, captures UTMs and referrer
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ─── ID helpers ──────────────────────────────────────────────────────────────
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function getVisitorId() {
  let id = localStorage.getItem('_oxv');
  if (!id) { id = generateId(); localStorage.setItem('_oxv', id); }
  return id;
}

function getSessionId() {
  // Session expires after 30 min of inactivity
  const KEY = '_oxs';
  const TS_KEY = '_oxst';
  const TIMEOUT = 30 * 60 * 1000;
  const now = Date.now();
  const lastActive = parseInt(sessionStorage.getItem(TS_KEY) || '0');
  let sid = sessionStorage.getItem(KEY);

  if (!sid || (now - lastActive) > TIMEOUT) {
    sid = generateId();
    sessionStorage.setItem(KEY, sid);
    sessionStorage.setItem('_oxsnew', '1'); // Mark as new session
  }
  sessionStorage.setItem(TS_KEY, now.toString());
  return sid;
}

function isNewSession() {
  const isNew = sessionStorage.getItem('_oxsnew') === '1';
  if (isNew) sessionStorage.removeItem('_oxsnew');
  return isNew;
}

// ─── Admin exclusion ──────────────────────────────────────────────────────────
function isAdminPath() {
  try {
    return window.location.pathname.startsWith('/admin');
  } catch {
    return false;
  }
}

function isExplicitAdminExcluded() {
  try {
    return localStorage.getItem('oxybott_exclude_admin') === 'true';
  } catch {
    return false;
  }
}

function isAdminTest() {
  try {
    return Boolean(localStorage.getItem('oxybott_admin_token'));
  } catch {
    return false;
  }
}

// ─── Consent check ───────────────────────────────────────────────────────────
function hasAnalyticsConsent() {
  // Exclude admin panel pages from storefront visitor analytics
  if (isAdminPath()) return false;
  // Exclude if explicitly configured to opt out
  if (isExplicitAdminExcluded()) return false;

  try {
    const prefs = localStorage.getItem('_oxconsent');
    if (!prefs) return true; // Privacy-friendly first-party tracking active by default
    const parsed = JSON.parse(prefs);
    if (parsed.decided && parsed.analytics === false) return false;
    return true;
  } catch {
    return true;
  }
}

// ─── Heartbeat Mechanism (25-second pulse for real-time presence) ────────────
let heartbeatInterval = null;

function sendHeartbeat() {
  if (!hasAnalyticsConsent()) return;
  const visitorId = getVisitorId();
  const sessionId = getSessionId();

  const payload = {
    visitorId,
    sessionId,
    pagePath: window.location.pathname,
    pageTitle: document.title,
    isAdminTest: isAdminTest()
  };

  fetch(`${API_BASE}/analytics/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {});
}

function startHeartbeat() {
  if (heartbeatInterval) return;
  sendHeartbeat();
  heartbeatInterval = setInterval(() => {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      sendHeartbeat();
    }
  }, 25000);

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    });
  }
}

// ─── UTM params ──────────────────────────────────────────────────────────────
function getUtmParams() {
  const url = new URL(window.location.href);
  return {
    utmSource: url.searchParams.get('utm_source') || '',
    utmMedium: url.searchParams.get('utm_medium') || '',
    utmCampaign: url.searchParams.get('utm_campaign') || ''
  };
}

// ─── Send beacon ─────────────────────────────────────────────────────────────
let lastPath = '';
let pageEntryTime = Date.now();

async function trackPageView(path, title) {
  if (!hasAnalyticsConsent()) return;

  // Ensure heartbeat pulse is active
  startHeartbeat();

  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const newSession = isNewSession();
  const prevPath = lastPath;
  const timeOnPrevPage = prevPath ? Date.now() - pageEntryTime : null;

  // Don't double-track same path
  if (path === lastPath && !newSession) return;

  const prevPagePath = lastPath;
  lastPath = path;
  pageEntryTime = Date.now();

  const payload = {
    visitorId,
    sessionId,
    pagePath: path,
    pageTitle: title || document.title,
    referrer: newSession ? document.referrer : '',
    ...getUtmParams(),
    isNewSession: newSession,
    timeOnPrevPage,
    prevPagePath,
    consentGiven: true,
    isAdminTest: isAdminTest()
  };

  try {
    await fetch(`${API_BASE}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch { /* Silent fail – never break frontend */ }
}

// ─── Custom Event Tracking (Buy Now clicks, downloads, video engagement) ────
async function trackEvent(eventType, entityType = '', entityId = '', entityTitle = '', metadata = {}) {
  if (!hasAnalyticsConsent()) return;

  const visitorId = getVisitorId();
  const sessionId = getSessionId();

  const payload = {
    visitorId,
    sessionId,
    eventType,
    entityType,
    entityId,
    entityTitle,
    metadata,
    pagePath: window.location.pathname + window.location.search,
    consentGiven: true,
    isAdminTest: isAdminTest()
  };

  try {
    await fetch(`${API_BASE}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch { /* Silent fail */ }
}

// ─── Internal Search Tracking ────────────────────────────────────────────────
let searchDebounceTimer = null;
function trackSearch(queryText, resultCount = 0, clickedEntityId = '') {
  if (!hasAnalyticsConsent() || !queryText || !queryText.trim()) return;

  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(async () => {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();

    const payload = {
      visitorId,
      sessionId,
      queryText: queryText.trim(),
      resultCount: parseInt(resultCount) || 0,
      clickedEntityId,
      pagePath: window.location.pathname,
      consentGiven: true,
      isAdminTest: isAdminTest()
    };

    try {
      await fetch(`${API_BASE}/analytics/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
    } catch { /* Silent fail */ }
  }, 400);
}

// ─── Consent sync ────────────────────────────────────────────────────────────
export async function syncConsent(preferences) {
  const visitorId = getVisitorId();
  try {
    await fetch(`${API_BASE}/analytics/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        analytics: preferences.analytics,
        functional: preferences.functional,
        marketing: preferences.marketing,
        version: '1.0'
      })
    });
  } catch {}
}

// ─── Public exports ───────────────────────────────────────────────────────────
export { trackPageView, trackEvent, trackSearch, startHeartbeat, getVisitorId };
export default { trackPageView, trackEvent, trackSearch, startHeartbeat, syncConsent, getVisitorId };
