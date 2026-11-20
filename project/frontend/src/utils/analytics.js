/**
 * Oxybott Analytics Tracker – Privacy-Friendly First-Party Visitor Intelligence
 * 
 * - Generates anonymous visitor ID (non-PII, no cross-site tracking)
 * - Measures ACTIVE user time only (pauses when tab hidden or idle > 30s)
 * - 15-second heartbeat for real-time presence + active duration accumulation
 * - Final duration flush via navigator.sendBeacon on pagehide
 * - Respects cookie consent & browser opt-out
 * - Auto-detects UTMs, referrers, and SPA route changes
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ─── ID Helpers ──────────────────────────────────────────────────────────────
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function getVisitorId() {
  try {
    let id = localStorage.getItem('_oxv');
    if (!id) {
      id = generateId();
      localStorage.setItem('_oxv', id);
    }
    return id;
  } catch {
    return 'anon-' + Math.random().toString(36).slice(2, 10);
  }
}

function getSessionId() {
  const KEY = '_oxs';
  const TS_KEY = '_oxst';
  const TIMEOUT = 30 * 60 * 1000; // 30 min inactivity timeout
  const now = Date.now();
  let lastActive = 0;
  let sid = null;

  try {
    lastActive = parseInt(sessionStorage.getItem(TS_KEY) || '0', 10);
    sid = sessionStorage.getItem(KEY);
  } catch {}

  if (!sid || (now - lastActive) > TIMEOUT) {
    sid = generateId();
    try {
      sessionStorage.setItem(KEY, sid);
      sessionStorage.setItem('_oxsnew', '1');
    } catch {}
  }

  try {
    sessionStorage.setItem(TS_KEY, now.toString());
  } catch {}

  return sid;
}

function isNewSession() {
  try {
    const isNew = sessionStorage.getItem('_oxsnew') === '1';
    if (isNew) sessionStorage.removeItem('_oxsnew');
    return isNew;
  } catch {
    return false;
  }
}

// ─── Admin & Browser Opt-Out Exclusion ───────────────────────────────────────
function isAdminPath() {
  try {
    return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  } catch {
    return false;
  }
}

function isOptedOut() {
  try {
    return (
      localStorage.getItem('oxybott_exclude_admin') === 'true' ||
      localStorage.getItem('oxybott_exclude_analytics') === 'true' ||
      document.cookie.includes('_ox_optout=1')
    );
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

function hasAnalyticsConsent() {
  if (isAdminPath()) return false;
  if (isOptedOut()) return false;

  try {
    const prefs = localStorage.getItem('_oxconsent');
    if (!prefs) return true; // Default active first-party tracking until decided
    const parsed = JSON.parse(prefs);
    if (parsed.decided && parsed.analytics === false) return false;
    return true;
  } catch {
    return true;
  }
}

// ─── Active User Activity Tracking ───────────────────────────────────────────
// Measures only time when tab is visible AND user was active in previous 30s
let lastInteractionTime = Date.now();
let activeSecondsBuffer = 0;
let secondTicker = null;
let heartbeatInterval = null;
let activityListenersAttached = false;

function onUserActivity() {
  lastInteractionTime = Date.now();
}

function isUserActive() {
  if (typeof document === 'undefined') return false;
  if (document.visibilityState !== 'visible') return false;
  return (Date.now() - lastInteractionTime) <= 30000; // 30s idle threshold
}

function startActiveTracking() {
  if (typeof window === 'undefined') return;

  if (!activityListenersAttached) {
    activityListenersAttached = true;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    let throttleTimeout = null;

    events.forEach(ev => {
      window.addEventListener(ev, () => {
        if (!throttleTimeout) {
          onUserActivity();
          throttleTimeout = setTimeout(() => { throttleTimeout = null; }, 1000);
        }
      }, { passive: true });
    });

    // Flush active seconds on page hide or visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushActiveHeartbeat(false);
      } else {
        lastInteractionTime = Date.now();
      }
    });

    window.addEventListener('pagehide', () => {
      flushActiveHeartbeat(true);
    });
  }

  // Count active seconds every second
  if (!secondTicker) {
    secondTicker = setInterval(() => {
      if (isUserActive()) {
        activeSecondsBuffer += 1;
      }
    }, 1000);
  }

  // Send heartbeat pulse every 15 seconds
  if (!heartbeatInterval) {
    heartbeatInterval = setInterval(() => {
      flushActiveHeartbeat(false);
    }, 15000);
  }
}

function flushActiveHeartbeat(isFinal = false) {
  if (!hasAnalyticsConsent()) return;

  const secondsToSend = activeSecondsBuffer;
  activeSecondsBuffer = 0;

  const visitorId = getVisitorId();
  const sessionId = getSessionId();

  const payload = {
    visitorId,
    sessionId,
    pagePath: window.location.pathname,
    pageTitle: document.title,
    activeDelta: Math.max(0, secondsToSend),
    isFinal: Boolean(isFinal),
    isAdminTest: isAdminTest()
  };

  const url = `${API_BASE}/analytics/heartbeat`;

  if (isFinal && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const sent = navigator.sendBeacon(url, blob);
      if (sent) return;
    } catch {}
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {});
}

// ─── UTM Parameters ──────────────────────────────────────────────────────────
function getUtmParams() {
  if (typeof window === 'undefined') return {};
  const url = new URL(window.location.href);
  return {
    utmSource: url.searchParams.get('utm_source') || '',
    utmMedium: url.searchParams.get('utm_medium') || '',
    utmCampaign: url.searchParams.get('utm_campaign') || ''
  };
}

// ─── Page View Tracking ──────────────────────────────────────────────────────
let lastPath = '';
let pageEntryTime = Date.now();

async function trackPageView(path, title) {
  if (!hasAnalyticsConsent()) return;

  // Ensure active pulse monitoring is running
  startActiveTracking();

  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const newSession = isNewSession();
  const prevPath = lastPath;
  const timeOnPrevPage = prevPath ? Math.round((Date.now() - pageEntryTime) / 1000) : null;

  if (path === lastPath && !newSession) return;

  const prevPagePath = lastPath;
  lastPath = path;
  pageEntryTime = Date.now();
  lastInteractionTime = Date.now();

  const payload = {
    visitorId,
    sessionId,
    pagePath: path,
    pageTitle: title || (typeof document !== 'undefined' ? document.title : ''),
    referrer: newSession && typeof document !== 'undefined' ? document.referrer : '',
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
  } catch {}
}

// ─── Custom Event Tracking ───────────────────────────────────────────────────
async function trackEvent(eventType, entityType = '', entityId = '', entityTitle = '', metadata = {}) {
  if (!hasAnalyticsConsent()) return;

  lastInteractionTime = Date.now();
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
  } catch {}
}

// ─── Search Tracking ─────────────────────────────────────────────────────────
let searchDebounceTimer = null;
function trackSearch(queryText, resultCount = 0, clickedEntityId = '') {
  if (!hasAnalyticsConsent() || !queryText || !queryText.trim()) return;

  lastInteractionTime = Date.now();
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(async () => {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();

    const payload = {
      visitorId,
      sessionId,
      queryText: queryText.trim(),
      resultCount: parseInt(resultCount, 10) || 0,
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
    } catch {}
  }, 400);
}

// ─── Consent Sync & Browser Opt-Out ──────────────────────────────────────────
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

export function setTrackingOptOut(optedOut) {
  try {
    if (optedOut) {
      localStorage.setItem('oxybott_exclude_analytics', 'true');
      document.cookie = '_ox_optout=1; path=/; max-age=31536000';
    } else {
      localStorage.removeItem('oxybott_exclude_analytics');
      document.cookie = '_ox_optout=0; path=/; max-age=0';
    }
  } catch {}
}

export function isTrackingOptedOut() {
  return isOptedOut();
}

// ─── Exports ─────────────────────────────────────────────────────────────────
export { trackPageView, trackEvent, trackSearch, getVisitorId };
export default {
  trackPageView,
  trackEvent,
  trackSearch,
  syncConsent,
  setTrackingOptOut,
  isTrackingOptedOut,
  getVisitorId
};
