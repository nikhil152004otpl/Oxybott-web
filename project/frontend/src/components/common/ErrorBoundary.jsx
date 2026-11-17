import React from 'react';
import { useRouteError, Link } from 'react-router-dom';

export default function ErrorBoundary() {
  const error = useRouteError();

  return (
    <main className="not-found-container container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <div className="not-found-code" style={{ color: 'var(--oxy-orange)' }}>Oops!</div>
      <h1 className="not-found-title" style={{ marginTop: '1rem' }}>Something Went Wrong</h1>
      <p className="not-found-desc" style={{ maxWidth: '600px', margin: '1rem auto 2rem' }}>
        An unexpected error occurred while loading this section. You can reload or navigate back to the home page.
      </p>
      {error?.message && (
        <pre style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', maxWidth: '700px', margin: '0 auto 2rem', overflowX: 'auto', textAlign: 'left', fontSize: '0.82rem', color: '#dc2626' }}>
          {error.message}
        </pre>
      )}
      <div className="not-found-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload Page
        </button>
        <Link to="/" className="btn btn-outline">
          Return to Homepage
        </Link>
        <Link to="/contact" className="btn btn-outline">
          Contact Support
        </Link>
      </div>
    </main>
  );
}

