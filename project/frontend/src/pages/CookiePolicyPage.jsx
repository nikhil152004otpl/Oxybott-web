import React from 'react';
import { Link } from 'react-router-dom';

export default function CookiePolicyPage() {
  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '4rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ color: 'var(--oxy-primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
          ← Back to Home
        </Link>
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--oxy-navy)', marginBottom: '0.5rem' }}>
        Cookie Policy
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
        Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
          What Are Cookies?
        </h2>
        <p style={{ color: '#374151', lineHeight: 1.7, margin: 0 }}>
          Cookies are small text files stored on your device when you visit a website. They help websites
          remember your preferences and analyze how the site is used. Oxybott uses only first-party cookies
          — we do not use third-party advertising trackers.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          Cookie Categories
        </h2>

        {[
          {
            title: '1. Strictly Necessary Cookies',
            badge: 'Always Active',
            badgeColor: '#dbeafe',
            badgeText: '#1e40af',
            desc: 'These cookies are essential for the website to function and cannot be disabled. They support secure login sessions, CSRF protection, and authentication.',
            cookies: [
              { name: 'oxybott_token', purpose: 'Admin authentication JWT token', duration: '24 hours' },
              { name: 'connect.sid', purpose: 'Session management', duration: 'Session' }
            ]
          },
          {
            title: '2. Analytics Cookies',
            badge: 'Optional',
            badgeColor: '#dcfce7',
            badgeText: '#166534',
            desc: 'Help us understand how visitors interact with our website by collecting anonymous usage data. No personally identifiable information is collected.',
            cookies: [
              { name: '_oxv', purpose: 'Anonymous visitor ID (non-PII)', duration: '1 year' },
              { name: '_oxs, _oxst, _oxsnew', purpose: 'Session tracking identifiers', duration: 'Session' },
              { name: '_oxconsent', purpose: 'Stores your cookie preferences', duration: '1 year' }
            ]
          },
          {
            title: '3. Functional Cookies',
            badge: 'Optional',
            badgeColor: '#dcfce7',
            badgeText: '#166534',
            desc: 'Allow the website to remember your preferences for a personalized experience.',
            cookies: [
              { name: 'oxybott_cart', purpose: 'Shopping cart contents', duration: '7 days' }
            ]
          },
          {
            title: '4. Marketing Cookies',
            badge: 'Optional',
            badgeColor: '#fef3c7',
            badgeText: '#92400e',
            desc: 'Currently, Oxybott does not use marketing or advertising cookies. This category is reserved for future use and will only be activated with your explicit consent.',
            cookies: []
          }
        ].map(cat => (
          <div key={cat.title} style={{ marginBottom: '1.5rem', padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{cat.title}</h3>
              <span style={{ fontSize: '0.7rem', background: cat.badgeColor, color: cat.badgeText, padding: '1px 7px', borderRadius: '20px', fontWeight: 600 }}>
                {cat.badge}
              </span>
            </div>
            <p style={{ margin: '0 0 0.75rem', color: '#374151', fontSize: '0.875rem', lineHeight: 1.6 }}>{cat.desc}</p>
            {cat.cookies.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#e2e8f0' }}>
                    <th style={{ padding: '0.4rem 0.75rem', textAlign: 'left', borderRadius: '4px 0 0 4px' }}>Cookie Name</th>
                    <th style={{ padding: '0.4rem 0.75rem', textAlign: 'left' }}>Purpose</th>
                    <th style={{ padding: '0.4rem 0.75rem', textAlign: 'left', borderRadius: '0 4px 4px 0' }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.cookies.map(c => (
                    <tr key={c.name} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.4rem 0.75rem', fontFamily: 'monospace', color: '#1e40af' }}>{c.name}</td>
                      <td style={{ padding: '0.4rem 0.75rem', color: '#374151' }}>{c.purpose}</td>
                      <td style={{ padding: '0.4rem 0.75rem', color: '#64748b' }}>{c.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
          Managing Your Preferences
        </h2>
        <p style={{ color: '#374151', lineHeight: 1.7, marginBottom: '1rem' }}>
          You can change your cookie preferences at any time by clicking{' '}
          <button
            onClick={() => window.dispatchEvent(new Event('openCookiePreferences'))}
            style={{ background: 'none', border: 'none', color: 'var(--oxy-primary)', cursor: 'pointer', fontSize: 'inherit', fontWeight: 600, padding: 0, textDecoration: 'underline' }}
          >
            Cookie Settings
          </button>
          {' '}in the website footer.
        </p>
        <p style={{ color: '#374151', lineHeight: 1.7, margin: 0 }}>
          You can also control cookies through your browser settings. Note that disabling certain cookies
          may affect website functionality.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
          Contact
        </h2>
        <p style={{ color: '#374151', lineHeight: 1.7, margin: 0 }}>
          If you have questions about how we use cookies, please{' '}
          <Link to="/contact" style={{ color: 'var(--oxy-primary)', fontWeight: 600 }}>contact us</Link>.
          Oxybott is committed to transparent and minimal data collection.
        </p>
      </section>
    </main>
  );
}
