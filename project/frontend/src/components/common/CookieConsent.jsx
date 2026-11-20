import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useConsent } from '../../context/ConsentContext';

export default function CookieConsent() {
  const { prefs, acceptAll, rejectOptional, updatePrefs } = useConsent();
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [localPrefs, setLocalPrefs] = useState({
    analytics: false,
    functional: false,
    marketing: false
  });

  useEffect(() => {
    // Show banner only if user hasn't decided yet
    if (!prefs.decided) {
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [prefs.decided]);

  // Listen for "open cookie preferences" event from footer
  useEffect(() => {
    const handler = () => {
      setLocalPrefs({ analytics: prefs.analytics, functional: prefs.functional, marketing: prefs.marketing });
      setShowPreferences(true);
      setShowBanner(false);
    };
    window.addEventListener('openCookiePreferences', handler);
    return () => window.removeEventListener('openCookiePreferences', handler);
  }, [prefs]);

  const handleAcceptAll = () => {
    acceptAll();
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleRejectOptional = () => {
    rejectOptional();
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleSavePreferences = () => {
    updatePrefs(localPrefs);
    setShowPreferences(false);
    setShowBanner(false);
  };

  const openPreferences = () => {
    setLocalPrefs({ analytics: prefs.analytics, functional: prefs.functional, marketing: prefs.marketing });
    setShowPreferences(true);
    setShowBanner(false);
  };

  if (!showBanner && !showPreferences) return null;

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && !showPreferences && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cookie consent"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(560px, calc(100vw - 2rem))',
            background: '#0f172a',
            color: '#e2e8f0',
            borderRadius: '14px',
            padding: '1.5rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            zIndex: 99999,
            border: '1px solid rgba(255,255,255,0.08)',
            animation: 'slideUp 0.35s ease'
          }}
        >
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateX(-50%) translateY(20px); }
              to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem', color: '#f1f5f9' }}>
              🍪 Cookie Preferences
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
              We use cookies to analyze site traffic and improve your experience. Essential cookies
              are always active. You can manage optional cookies below.{' '}
              <Link to="/cookies" style={{ color: '#60a5fa', textDecoration: 'none' }}>Learn more</Link>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleAcceptAll}
              style={{
                flex: 1, minWidth: '120px',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--oxy-primary, #2563eb)',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.15s'
              }}
            >
              Accept All
            </button>
            <button
              onClick={handleRejectOptional}
              style={{
                flex: 1, minWidth: '120px',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent',
                color: '#cbd5e1',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reject Optional
            </button>
            <button
              onClick={openPreferences}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Customize
            </button>
          </div>
        </div>
      )}

      {/* Preference Center Modal */}
      {showPreferences && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e) => e.target === e.currentTarget && setShowPreferences(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
                Cookie Preferences
              </h2>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Choose which cookies you allow. Strictly necessary cookies cannot be disabled.
              </p>
            </div>

            {/* Categories */}
            <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                {
                  key: 'necessary',
                  label: 'Strictly Necessary',
                  description: 'Required for the website to function: session management, security (CSRF), and authentication.',
                  locked: true
                },
                {
                  key: 'analytics',
                  label: 'Analytics',
                  description: 'Helps us understand how visitors use the site through anonymous traffic data, page views, and session duration.',
                  locked: false
                },
                {
                  key: 'functional',
                  label: 'Functional',
                  description: 'Remembers your preferences such as language or display settings for a better experience.',
                  locked: false
                },
                {
                  key: 'marketing',
                  label: 'Marketing',
                  description: 'Used to deliver relevant advertisements and measure campaign effectiveness.',
                  locked: false
                }
              ].map(cat => (
                <div
                  key={cat.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1rem',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                      {cat.label}
                      {cat.locked && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Always On
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                      {cat.description}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>
                    <label style={{ position: 'relative', display: 'inline-block', width: '42px', height: '24px', cursor: cat.locked ? 'not-allowed' : 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={cat.locked ? true : (localPrefs[cat.key] ?? false)}
                        disabled={cat.locked}
                        onChange={(e) => !cat.locked && setLocalPrefs(p => ({ ...p, [cat.key]: e.target.checked }))}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute', inset: 0,
                        borderRadius: '12px',
                        background: (cat.locked || localPrefs[cat.key]) ? 'var(--oxy-primary, #2563eb)' : '#cbd5e1',
                        transition: 'background 0.2s'
                      }}>
                        <span style={{
                          position: 'absolute',
                          top: '3px',
                          left: (cat.locked || localPrefs[cat.key]) ? '21px' : '3px',
                          width: '18px', height: '18px',
                          borderRadius: '50%',
                          background: '#fff',
                          transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={handleRejectOptional}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '8px',
                  border: '1px solid #e2e8f0', background: '#fff',
                  color: '#475569', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Reject Optional
              </button>
              <button
                onClick={handleSavePreferences}
                style={{
                  padding: '0.6rem 1.4rem', borderRadius: '8px',
                  border: 'none', background: 'var(--oxy-primary, #2563eb)',
                  color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Save Preferences
              </button>
              <button
                onClick={handleAcceptAll}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '8px',
                  border: 'none', background: '#0f172a',
                  color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
