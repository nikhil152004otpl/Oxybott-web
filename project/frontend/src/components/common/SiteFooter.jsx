import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { IconYouTube, IconTwitterX, IconGitHub, IconLinkedIn } from './Icons';

export default function SiteFooter() {
  const { settings, navigation } = useStore();
  const brandName = settings?.store_name || 'Oxybott STEM Robotics';

  const footerQuickLinks = navigation?.footerQuick?.length > 0 ? navigation.footerQuick : [
    { id: '1', label: 'Robotics Catalog', url: '/products' },
    { id: '2', label: 'School Curriculum', url: '/education' },
    { id: '3', label: 'OxyCode IDE', url: '/software' },
    { id: '4', label: 'Video Tutorials', url: '/tutorials' },
    { id: '5', label: 'About Our Story', url: '/about' }
  ];

  const footerProductLinks = navigation?.footerProducts?.length > 0 ? navigation.footerProducts : [
    { id: '1', label: 'Explorer Series (8+)', url: '/products?series=Explorer+Series' },
    { id: '2', label: 'Education Series (Schools)', url: '/products?series=Education+Series' },
    { id: '3', label: 'Inventor Robotics (12+)', url: '/products?series=Inventor+Series' },
    { id: '4', label: 'Maker & Sensor Labs', url: '/products?series=Maker+Series' },
    { id: '5', label: 'All Products', url: '/products' }
  ];

  const footerSupportLinks = navigation?.footerSupport?.length > 0 ? navigation.footerSupport : [
    { id: '1', label: 'Help Center & FAQ', url: '/contact' },
    { id: '2', label: 'Assembly Manuals (PDF)', url: '/tutorials' },
    { id: '3', label: 'USB Driver Setup', url: '/software' },
    { id: '4', label: 'Order On OSEMI', url: 'https://osemi.in' },
    { id: '5', label: 'Admin Portal', url: '/admin' }
  ];

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          {/* Brand Summary Column */}
          <div className="footer-brand-col">
            <Link to="/">
              <img
                src={settings?.logo_url || "/assets/images/oxybott_logo.webp"}
                alt={brandName}
                className="brand-logo-img"
                loading="lazy"
                decoding="async"
              />
            </Link>
            <p className="footer-tagline">
              {settings?.store_tagline || `${brandName} is an international leader in ESP32-powered STEM kits, bionic robotics, and comprehensive classroom solutions for educators and makers.`}
            </p>
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
              {settings?.support_email && (
                <div>Support: <a href={`mailto:${settings.support_email}`} style={{ color: '#7dd3fc', textDecoration: 'none' }}>{settings.support_email}</a></div>
              )}
              {settings?.contact_email && (
                <div>School Orders: <a href={`mailto:${settings.contact_email}`} style={{ color: '#7dd3fc', textDecoration: 'none' }}>{settings.contact_email}</a></div>
              )}
              {settings?.phone && (
                <div>Phone: <span style={{ color: '#e2e8f0' }}>{settings.phone}</span></div>
              )}
            </div>
            <div className="footer-social-links" style={{ marginTop: '1rem' }}>
              <a href={settings?.youtube_url || "https://youtube.com"} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="YouTube">
                <IconYouTube size={18} />
              </a>
              <a href={settings?.twitter_url || "https://twitter.com"} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Twitter">
                <IconTwitterX size={15} />
              </a>
              <a href={settings?.github_url || "https://github.com"} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="GitHub">
                <IconGitHub size={17} />
              </a>
              <a href={settings?.linkedin_url || "https://linkedin.com"} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
                <IconLinkedIn size={16} />
              </a>
            </div>
          </div>

          {/* Column 1: Products */}
          <div className="footer-col">
            <h4 className="footer-col-title">STEM Kits</h4>
            <ul className="footer-links-list">
              {footerProductLinks.map(link => (
                <li key={link.id}>
                  {link.url.startsWith('http') ? (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="footer-link">{link.label}</a>
                  ) : (
                    <Link to={link.url} className="footer-link">{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Education */}
          <div className="footer-col">
            <h4 className="footer-col-title">Education</h4>
            <ul className="footer-links-list">
              <li><Link to="/education" className="footer-link">Classroom Solutions</Link></li>
              <li><Link to="/education#sample" className="footer-link">Request Free Teacher Sample</Link></li>
              <li><Link to="/education#discounts" className="footer-link">Educational Discounts</Link></li>
              <li><Link to="/tutorials" className="footer-link">Standards Alignment (NGSS)</Link></li>
              <li><Link to="/about#distributors" className="footer-link">Become a Distributor</Link></li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links-list">
              {footerQuickLinks.map(link => (
                <li key={link.id}>
                  {link.url.startsWith('http') ? (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="footer-link">{link.label}</a>
                  ) : (
                    <Link to={link.url} className="footer-link">{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Support & Company */}
          <div className="footer-col">
            <h4 className="footer-col-title">Support &amp; Portal</h4>
            <ul className="footer-links-list">
              {footerSupportLinks.map(link => (
                <li key={link.id}>
                  {link.url.startsWith('http') ? (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="footer-link">{link.label}</a>
                  ) : (
                    <Link to={link.url} className="footer-link">{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} {brandName}. {settings?.copyright_extra || 'All rights reserved. ESP32 is a registered trademark of Espressif Systems.'}
          </div>
          <div className="footer-legal-links">
            <Link to="/contact">Privacy Policy</Link>
            <Link to="/contact">Terms of Service</Link>
            <a href="https://osemi.in" target="_blank" rel="noopener noreferrer">Fulfillment via OSEMI</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
