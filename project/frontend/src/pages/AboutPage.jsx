import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CMSAPI } from '../services/api';
import { IconLightning, IconGlobe, IconHandshake } from '../components/common/Icons';

export default function AboutPage() {
  const [cmsPage, setCmsPage] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const res = await CMSAPI.getPage('about');
      if (res.success && res.page) {
        setCmsPage(res.page);
      }
    } catch (e) {
      console.warn('Could not load about page CMS data, using defaults:', e);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    const handleStorage = (e) => {
      if (e.key === 'oxybott_cms_sync' || e.key === 'oxybott_settings_sync') loadData();
    };

    window.addEventListener('oxybott_cms_updated', handleSync);
    window.addEventListener('oxybott_settings_updated', handleSync);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('oxybott_cms_updated', handleSync);
      window.removeEventListener('oxybott_settings_updated', handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadData]);

  const heroSec = cmsPage?.sections?.hero;
  const storySec = cmsPage?.sections?.story;
  const valuesSec = cmsPage?.sections?.values;
  const statsList = heroSec?.content?.stats || [
    { number: '500k+', label: 'Students Inspired Globally' },
    { number: '2,400+', label: 'Partner Schools & Labs' },
    { number: '65+', label: 'Countries with Active Kits' },
    { number: '100%', label: 'Open Source Commitment' }
  ];

  return (
    <main id="mainContent">
      {/* Hero */}
      <section className="about-hero">
        <div className="container container-narrow">
          <span className="section-tag" style={{ background: 'rgba(0, 153, 255, 0.2)', color: '#7dd3fc' }}>
            {heroSec?.tag || 'Our Mission'}
          </span>
          <h1 style={{ color: 'var(--oxy-white)', marginBottom: '1.25rem' }}>
            {heroSec?.title || 'Democratizing Robotics & STEM Education'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', lineHeight: 1.6 }}>
            {heroSec?.subtitle || 'At Oxybott, we believe every child deserves the tools, confidence, and curiosity to build the future. We design intelligent, open-source educational hardware that turns abstract code into tangible kinetic creation.'}
          </p>
          {heroSec?.description && (
            <p style={{ color: '#cbd5e1', fontSize: '1rem', marginTop: '0.75rem', lineHeight: 1.6 }}>
              {heroSec.description}
            </p>
          )}
        </div>
      </section>

      <div className="container" style={{ paddingBottom: '6rem' }}>
        {/* Story Row 1 */}
        <div className="about-story-row">
          <div>
            <span className="section-tag">{storySec?.tag || 'Who We Are'}</span>
            <h2 style={{ marginBottom: '1.25rem' }}>{storySec?.title || 'Born from a Passion for Hands-On Engineering'}</h2>
            {storySec?.subtitle && (
              <p style={{ fontSize: '1.05rem', color: 'var(--oxy-primary)', fontWeight: 600, marginBottom: '0.75rem' }}>
                {storySec.subtitle}
              </p>
            )}
            {storySec?.description && (
              <p style={{ fontSize: '0.95rem', color: 'var(--oxy-gray-500)', marginBottom: '1rem', lineHeight: 1.5 }}>
                {storySec.description}
              </p>
            )}
            <p style={{ fontSize: '1.05rem', color: 'var(--oxy-gray-600)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              {storySec?.content?.paragraphs?.[0] || 'Founded by roboticists, educators, and embedded hardware engineers, Oxybott was created to address a critical gap in modern STEM education: kits were either too simplistic toys that lacked real programmable depth, or complex industrial hardware that overwhelmed teachers and students.'}
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--oxy-gray-600)', lineHeight: 1.7 }}>
              {storySec?.content?.paragraphs?.[1] || 'By standardizing on the powerful 240MHz ESP32 dual-core architecture, we brought real Wi-Fi and Bluetooth IoT capabilities to students at accessible prices, supported by our anti-reverse Easy-Plug wiring system.'}
            </p>
          </div>
          <div>
            <img
              src={storySec?.content?.image_url || "/assets/images/hardware-ecosystem.webp"}
              alt={storySec?.title || "Oxybott Hardware Ecosystem"}
              style={{ width: '100%', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)' }}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {/* Stats Banner */}
        <div className="stats-counter-grid">
          {statsList.map((stat, idx) => (
            <div key={idx}>
              <div className="stat-number">{stat.number || stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Core Principles / Values Section (Managed via CMS) */}
        {valuesSec && (
          <section className="about-values-section" style={{ marginTop: '4rem', marginBottom: '4rem' }}>
            <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 2.5rem' }}>
              <span className="section-tag">{valuesSec.tag || 'Core Principles'}</span>
              <h2 style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>{valuesSec.title || 'Engineering Values That Guide Us'}</h2>
              {valuesSec.subtitle && (
                <p style={{ color: 'var(--oxy-primary)', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {valuesSec.subtitle}
                </p>
              )}
              {valuesSec.description && (
                <p style={{ color: 'var(--oxy-gray-600)', fontSize: '1rem', lineHeight: 1.6 }}>
                  {valuesSec.description}
                </p>
              )}
            </div>

            {valuesSec.content?.values && Array.isArray(valuesSec.content.values) ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                {valuesSec.content.values.map((val, idx) => (
                  <div key={idx} style={{ background: 'var(--oxy-white)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--oxy-gray-200)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                      {idx === 0 ? (
                        <IconLightning size={24} style={{ color: 'var(--oxy-primary)' }} />
                      ) : idx === 1 ? (
                        <IconGlobe size={24} style={{ color: 'var(--oxy-primary)' }} />
                      ) : (
                        <IconHandshake size={24} style={{ color: 'var(--oxy-primary)' }} />
                      )}
                    </div>
                    <h3 style={{ color: 'var(--oxy-navy)', marginBottom: '0.5rem', fontSize: '1.15rem' }}>{val.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--oxy-gray-600)', lineHeight: 1.6, margin: 0 }}>{val.desc}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        )}

        {/* OEM & Co-Branding Section */}
        <div className="oem-box" id="oem">
          <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 3rem' }}>
            <span className="section-tag orange">Enterprise Partnerships</span>
            <h2 style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>Co-Branding, OEM &amp; Custom STEM Product Lines</h2>
            <p style={{ color: 'var(--oxy-gray-600)', fontSize: '1.05rem' }}>
              We work with educational publishers, national school networks, and robotics brands to develop custom hardware lines, localized textbooks, and private-label STEM kits.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div style={{ background: 'var(--oxy-white)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--oxy-gray-200)' }}>
              <h4 style={{ color: 'var(--oxy-navy)', marginBottom: '0.5rem' }}>Custom Laser-Cut Chassis &amp; Branding</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--oxy-gray-600)', lineHeight: 1.6 }}>
                Integrate your institution&apos;s logo, colors, and mascot directly onto our robotic chassis and custom printed packaging.
              </p>
            </div>
            <div style={{ background: 'var(--oxy-white)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--oxy-gray-200)' }}>
              <h4 style={{ color: 'var(--oxy-navy)', marginBottom: '0.5rem' }}>Bespoke Shield PCBs &amp; Sensors</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--oxy-gray-600)', lineHeight: 1.6 }}>
                Design specialized daughter boards, AI vision camera mounts, or wireless sensor arrays tailored for your competition rules.
              </p>
            </div>
            <div style={{ background: 'var(--oxy-white)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--oxy-gray-200)' }}>
              <h4 style={{ color: 'var(--oxy-navy)', marginBottom: '0.5rem' }}>Curriculum Co-Authoring</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--oxy-gray-600)', lineHeight: 1.6 }}>
                Our curriculum specialists collaborate with your team to produce aligned student manuals, teacher slide decks, and grading rubrics.
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link to="/contact" className="btn btn-orange btn-lg">
              {cmsPage?.sections?.oem?.content?.primaryBtn?.text || 'Inquire About OEM & Distribution \u2192'}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
