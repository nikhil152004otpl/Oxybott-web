import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import MegaMenu from './MegaMenu';
import { IconSearch, IconShoppingCart, IconMenu, IconX } from './Icons';

export default function SiteHeader({ onOpenSearch, onOpenQuote }) {
  const { count, openCart } = useCart();
  const { settings, navigation } = useStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerNavItems = navigation?.header?.length > 0 ? navigation.header : [
    { id: '1', label: 'Products', url: '/products', badge: '' },
    { id: '2', label: 'Education Solutions', url: '/education', badge: 'Schools' },
    { id: '3', label: 'Software', url: '/software', badge: '' },
    { id: '4', label: 'Tutorials', url: '/tutorials', badge: 'Videos' },
    { id: '5', label: 'About Us', url: '/about', badge: '' },
    { id: '6', label: 'Contact', url: '/contact', badge: '' }
  ];

  return (
    <>
      <header className={`site-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container header-wrapper">
          {/* Brand Logo */}
          <Link to="/" className="brand-logo-link" aria-label={settings?.store_name || "Oxybott Home"}>
            <img
              src={settings?.logo_url || "/assets/images/oxybott_logo.webp"}
              alt={settings?.store_name ? `${settings.store_name} Logo` : "Oxybott Logo"}
              className="brand-logo-img"
              width="160"
              height="42"
            />
          </Link>

          {/* Desktop Navigation Menu */}
          <nav className="main-nav" aria-label="Main Navigation">
            <ul className="nav-list">
              {headerNavItems.map(item => {
                const isProducts = item.url === '/products' || item.label.toLowerCase() === 'products';
                return (
                  <li key={item.id} className={`nav-item ${isProducts ? 'mega-menu-item' : ''}`}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                      {item.label}
                      {item.badge && (
                        <span style={{
                          fontSize: '0.65rem',
                          background: 'var(--oxy-orange)',
                          color: '#fff',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          marginLeft: '4px',
                          fontWeight: 700
                        }}>{item.badge}</span>
                      )}
                      {isProducts && (
                        <svg className="nav-arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor">
                          <path d="M2 4L6 8L10 4" />
                        </svg>
                      )}
                    </NavLink>
                    {isProducts && <MegaMenu />}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Action Tools */}
          <div className="header-actions">
            {/* Quick Search */}
            <button
              type="button"
              className="action-btn search-trigger"
              aria-label="Search Products (Ctrl+K)"
              onClick={onOpenSearch}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <IconSearch size={19} />
            </button>

            {/* Cart Trigger */}
            <button
              type="button"
              className="action-btn cart-trigger"
              aria-label="Shopping Cart"
              onClick={openCart}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <IconShoppingCart size={19} />
              <span className="cart-badge">{count}</span>
            </button>

            {/* Quote Modal Button */}
            <button
              type="button"
              className="btn btn-orange btn-sm quote-modal-trigger"
              onClick={onOpenQuote}
            >
              Get Free Quote
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="action-btn mobile-menu-btn"
              id="mobileMenuToggle"
              aria-label="Toggle Navigation Menu"
              onClick={() => setIsMobileOpen(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <IconMenu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        className={`cart-drawer-overlay ${isMobileOpen ? 'open' : ''}`}
        id="mobileNavOverlay"
        onClick={() => setIsMobileOpen(false)}
        style={{ display: isMobileOpen ? 'block' : 'none' }}
      >
        <div
          className={`cart-drawer ${isMobileOpen ? 'open' : ''}`}
          id="mobileNavDrawer"
          onClick={e => e.stopPropagation()}
        >
          <div className="cart-header">
            <img
              src="/assets/images/oxybott_logo.webp"
              alt="Oxybott"
              style={{ height: '36px' }}
              loading="lazy"
              decoding="async"
            />
            <button
              type="button"
              className="cart-close-btn"
              id="mobileNavClose"
              aria-label="Close Mobile Navigation"
              onClick={() => setIsMobileOpen(false)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <IconX size={20} />
            </button>
          </div>
          <div className="cart-body">
            <ul
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                fontFamily: 'var(--font-heading)',
                fontSize: '1.1rem',
                fontWeight: 700,
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}
            >
              <li>
                <Link to="/" style={{ color: 'var(--oxy-primary)' }} onClick={() => setIsMobileOpen(false)}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" onClick={() => setIsMobileOpen(false)}>
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  to="/products?series=Explorer+Series"
                  style={{ fontSize: '0.95rem', color: 'var(--oxy-gray-600)', paddingLeft: '1rem' }}
                  onClick={() => setIsMobileOpen(false)}
                >
                  &bull; Explorer Series
                </Link>
              </li>
              <li>
                <Link
                  to="/products?series=Education+Series"
                  style={{ fontSize: '0.95rem', color: 'var(--oxy-gray-600)', paddingLeft: '1rem' }}
                  onClick={() => setIsMobileOpen(false)}
                >
                  &bull; Education Series
                </Link>
              </li>
              <li>
                <Link
                  to="/products?series=Inventor+Series"
                  style={{ fontSize: '0.95rem', color: 'var(--oxy-gray-600)', paddingLeft: '1rem' }}
                  onClick={() => setIsMobileOpen(false)}
                >
                  &bull; Inventor Series
                </Link>
              </li>
              <li>
                <Link
                  to="/products?series=Maker+Series"
                  style={{ fontSize: '0.95rem', color: 'var(--oxy-gray-600)', paddingLeft: '1rem' }}
                  onClick={() => setIsMobileOpen(false)}
                >
                  &bull; Maker Series
                </Link>
              </li>
              <li>
                <Link to="/education" onClick={() => setIsMobileOpen(false)}>
                  Education Solutions
                </Link>
              </li>
              <li>
                <Link to="/software" onClick={() => setIsMobileOpen(false)}>
                  Software &amp; OxyCode
                </Link>
              </li>
              <li>
                <Link to="/tutorials" onClick={() => setIsMobileOpen(false)}>
                  Tutorials &amp; Wiki
                </Link>
              </li>
              <li>
                <Link to="/about" onClick={() => setIsMobileOpen(false)}>
                  About Oxybott
                </Link>
              </li>
              <li>
                <Link to="/contact" onClick={() => setIsMobileOpen(false)}>
                  Contact Us
                </Link>
              </li>
            </ul>
            <div style={{ margin: '2rem 0 0 0' }}>
              <button
                type="button"
                className="btn btn-orange quote-modal-trigger"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setIsMobileOpen(false);
                  if (onOpenQuote) onOpenQuote();
                }}
              >
                Get Free Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
