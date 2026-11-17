import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="not-found-container container">
      <div className="not-found-code">404</div>
      <h1 className="not-found-title">Page or Kit Not Found</h1>
      <p className="not-found-desc">
        The robot kit, tutorial, or resource page you requested may have moved, been renamed, or is currently undergoing classroom updates.
      </p>
      <div className="not-found-actions">
        <Link to="/" className="btn btn-primary">Return to Homepage</Link>
        <Link to="/products" className="btn btn-outline">Explore Product Catalog</Link>
        <Link to="/contact" className="btn btn-outline">Contact STEM Support</Link>
      </div>
    </main>
  );
}
