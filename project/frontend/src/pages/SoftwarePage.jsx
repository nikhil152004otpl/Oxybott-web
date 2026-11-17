import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { SoftwareAPI, CMSAPI } from '../services/api';
import {
  IconSparkles,
  IconCode,
  IconTerminal,
  IconCpu,
  IconLaptop,
  IconSmartphone,
  IconPython,
  IconDownload,
  IconExternalLink as IconExternal,
  IconCheck,
  IconApple,
  IconGooglePlay
} from '../components/common/Icons';

/* =========================================================================
   Software Page Component
   ========================================================================= */

export default function SoftwarePage() {
  const { showToast } = useToast();
  const [softwareList, setSoftwareList] = useState([]);
  const [cmsPage, setCmsPage] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [softRes, pageRes] = await Promise.allSettled([
        SoftwareAPI.getCatalog(),
        CMSAPI.getPage('software')
      ]);

      if (softRes.status === 'fulfilled' && softRes.value?.software?.length > 0) {
        setSoftwareList(softRes.value.software);
      }
      if (pageRes.status === 'fulfilled' && pageRes.value?.page) {
        setCmsPage(pageRes.value.page);
      }
    } catch (e) {
      console.warn('SoftwarePage data load error, using fallbacks:', e);
    } finally {
      setLoading(false);
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

  const handleDownload = (release) => {
    if (release.external_url && !release.file_path) {
      window.open(release.external_url, '_blank', 'noopener,noreferrer');
      return;
    }
    showToast(`Downloading ${release.file_name || 'software package'}...`);
    const downloadUrl = `/api/software/download/${release.id}`;
    window.location.href = downloadUrl;
  };

  const heroSec = cmsPage?.sections?.hero;
  const featSec = cmsPage?.sections?.features;

  // Dynamic icon helper for backend items
  const renderItemIcon = (iconName) => {
    switch (iconName) {
      case 'Smartphone':
        return <IconSmartphone size={24} />;
      case 'Terminal':
        return <IconTerminal size={24} />;
      case 'Cpu':
        return <IconCpu size={24} />;
      default:
        return <IconLaptop size={24} />;
    }
  };

  return (
    <main id="mainContent">
      {/* Hero Section */}
      <section className="software-hero" id="download">
        <div className="container container-narrow">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <span
              className="section-tag"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'rgba(14, 165, 233, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '0.35rem 0.95rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.04em'
              }}
            >
              <IconSparkles size={14} />
              {heroSec?.tag || 'Development Tools & SDKs'}
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            color: '#ffffff',
            fontSize: 'clamp(2.25rem, 4.5vw, 3.4rem)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            marginBottom: '1.25rem'
          }}>
            {heroSec?.title || 'Software Ecosystem for Oxybott Robotics'}
          </h1>

          <p style={{
            color: '#94a3b8',
            fontSize: 'clamp(1.05rem, 1.8vw, 1.22rem)',
            lineHeight: 1.65,
            maxWidth: '720px',
            margin: '0 auto'
          }}>
            {heroSec?.subtitle || 'From beginner-friendly Scratch 3.0 visual block coding to full Arduino C++ libraries and MicroPython runtime. Free, open, and cross-platform.'}
          </p>

          {heroSec?.description && (
            <p style={{ color: '#cbd5e1', fontSize: '1rem', marginTop: '0.85rem', lineHeight: 1.6, maxWidth: '640px', margin: '0.85rem auto 0' }}>
              {heroSec.description}
            </p>
          )}

          {(heroSec?.content?.primaryBtn || heroSec?.content?.secondaryBtn) && (
            <div style={{ marginTop: '2.25rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {heroSec.content.primaryBtn?.text && (
                <a
                  href={heroSec.content.primaryBtn.url || "#download"}
                  className="btn btn-primary btn-lg"
                  style={{
                    borderRadius: '9999px',
                    padding: '0.85rem 1.85rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                  }}
                >
                  {heroSec.content.primaryBtn.text}
                </a>
              )}
              {heroSec.content.secondaryBtn?.text && (
                <a
                  href={heroSec.content.secondaryBtn.url || "https://github.com/oxybott-robotics"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-white btn-lg"
                  style={{
                    borderRadius: '9999px',
                    padding: '0.85rem 1.85rem',
                    fontWeight: 600,
                    borderColor: 'rgba(255, 255, 255, 0.25)'
                  }}
                >
                  {heroSec.content.secondaryBtn.text}
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Software Pillars Bento Grid */}
      <div className="container">
        <div className="software-cards-grid">
          {softwareList.length > 0 ? (
            softwareList.map(item => {
              const osBadges = Array.isArray(item.supported_os) ? item.supported_os : [];
              const latestReleases = (item.releases || []).filter(r => r.is_published);

              return (
                <div key={item.id} className="soft-card">
                  <div
                    className="soft-card-icon"
                    style={{
                      background: item.icon_bg || 'rgba(14, 165, 233, 0.1)',
                      color: item.icon_color || '#0284c7'
                    }}
                  >
                    {renderItemIcon(item.icon)}
                  </div>
                  <h3 className="soft-card-title">{item.name}</h3>
                  <p className="soft-card-desc">
                    {item.short_desc || item.description}
                  </p>
                  {osBadges.length > 0 && (
                    <div className="os-badge-row">
                      {osBadges.map((badge, idx) => (
                        <span key={idx} className="os-badge">
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="soft-card-actions">
                    {latestReleases.length > 0 ? (
                      latestReleases.map(rel => (
                        <button
                          key={rel.id}
                          type="button"
                          className={rel.platform === 'windows' || rel.is_latest ? 'soft-btn-primary' : 'soft-btn-outline'}
                          onClick={() => handleDownload(rel)}
                        >
                          <IconDownload size={16} />
                          <span>
                            {rel.platform === 'windows' ? 'Download for Windows (.exe)' :
                             rel.platform === 'macos' ? 'Download for macOS (.dmg)' :
                             rel.platform === 'android' ? 'Download Android APK (.apk)' :
                             rel.platform === 'linux' ? 'Download for Linux (AppImage)' :
                             `Download ${rel.platform.toUpperCase()} (${rel.file_type || 'Release'})`}
                          </span>
                        </button>
                      ))
                    ) : (
                      <>
                        {item.primary_btn_text && (
                          <a
                            href={item.primary_btn_action || '#'}
                            className="soft-btn-primary"
                            target={item.primary_btn_action?.startsWith('http') ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                          >
                            <IconDownload size={16} />
                            <span>{item.primary_btn_text}</span>
                          </a>
                        )}
                        {item.secondary_btn_text && (
                          <a
                            href={item.secondary_btn_action || '#'}
                            className="soft-btn-outline"
                            target={item.secondary_btn_action?.startsWith('http') ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                          >
                            <IconExternal size={14} />
                            <span>{item.secondary_btn_text}</span>
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            /* Premium Fallback Cards */
            <>
              {/* OxyCode IDE */}
              <div className="soft-card">
                <div className="soft-card-icon" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
                  <IconCode size={26} />
                </div>
                <h3 className="soft-card-title">OxyCode 2.2.1 IDE</h3>
                <p className="soft-card-desc">
                  Our flagship graphical block programming suite based on Scratch 3.0. Features real-time live code translation to Arduino C++, serial console monitoring, and 1-click ESP32 flashing.
                </p>
                <div className="os-badge-row">
                  <span className="os-badge"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />Windows 10/11</span>
                  <span className="os-badge"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />macOS</span>
                  <span className="os-badge"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />Web Browser</span>
                </div>
                <div className="soft-card-actions">
                  <button
                    type="button"
                    className="soft-btn-primary"
                    onClick={() => showToast('Downloading OxyCode for Windows...')}
                  >
                    <IconDownload size={16} />
                    <span>Download for Windows (.exe)</span>
                  </button>
                  <button
                    type="button"
                    className="soft-btn-outline"
                    onClick={() => showToast('Downloading OxyCode for macOS...')}
                  >
                    <IconDownload size={16} />
                    <span>Download for macOS (.dmg)</span>
                  </button>
                </div>
              </div>

              {/* Arduino IDE Integration */}
              <div className="soft-card">
                <div className="soft-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <IconCpu size={26} />
                </div>
                <h3 className="soft-card-title">Arduino IDE &amp; Libraries</h3>
                <p className="soft-card-desc">
                  Official Oxybott ESP32 board support package, open-source C++ drivers, kinematics libraries for robot arms and biped walkers, and over 100 sample sketches.
                </p>
                <div className="os-badge-row">
                  <span className="os-badge"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />Arduino 1.8.x</span>
                  <span className="os-badge"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />Arduino 2.x</span>
                  <span className="os-badge"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />PlatformIO</span>
                </div>
                <div className="soft-card-actions">
                  <Link to="/tutorials" className="soft-btn-primary" style={{ background: '#059669' }}>
                    <span>Arduino Setup Guide</span>
                    <IconExternal size={14} />
                  </Link>
                  <button
                    type="button"
                    className="soft-btn-outline"
                    onClick={() => showToast('Downloading Oxybott Libraries ZIP...')}
                  >
                    <IconDownload size={16} />
                    <span>Download ZIP Library</span>
                  </button>
                </div>
              </div>

              {/* MicroPython / Thonny */}
              <div className="soft-card">
                <div className="soft-card-icon" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#ea580c' }}>
                  <IconPython size={26} />
                </div>
                <h3 className="soft-card-title">Python &amp; Thonny</h3>
                <p className="soft-card-desc">
                  Program your Oxybott robots with industry-standard MicroPython. Read ultrasonic radar data, connect to cloud MQTT brokers, and articulate robot arms in real time.
                </p>
                <div className="os-badge-row">
                  <span className="os-badge"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ea580c', display: 'inline-block' }} />MicroPython 1.22</span>
                  <span className="os-badge"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ea580c', display: 'inline-block' }} />Thonny IDE</span>
                  <span className="os-badge"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ea580c', display: 'inline-block' }} />Jupyter</span>
                </div>
                <div className="soft-card-actions">
                  <Link to="/tutorials#python" className="soft-btn-primary" style={{ background: '#ea580c' }}>
                    <span>Python Quickstart</span>
                    <IconExternal size={14} />
                  </Link>
                  <button
                    type="button"
                    className="soft-btn-outline"
                    onClick={() => showToast('Downloading ESP32 Firmware...')}
                  >
                    <IconDownload size={16} />
                    <span>Get ESP32 Firmware</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Capabilities & Mobile App Bento Showcase Section */}
      <section className="container" id="app" style={{ marginBottom: '6.5rem' }}>
        <div
          className="app-feature-row"
          style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            borderRadius: '24px',
            padding: 'clamp(2.5rem, 5vw, 4.25rem) clamp(1.75rem, 4vw, 3.5rem)',
            boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)'
          }}
        >
          <div>
            <span
              className="section-tag"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(249, 115, 22, 0.1)',
                color: '#ea580c',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                padding: '0.3rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                marginBottom: '1rem'
              }}
            >
              <IconSparkles size={13} />
              {featSec?.tag || 'Wireless Control'}
            </span>

            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.75rem, 3vw, 2.35rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#0f172a',
              marginBottom: '1rem',
              lineHeight: 1.2
            }}>
              {featSec?.title || 'Oxybott Mobile Controller App'}
            </h2>

            <p style={{
              fontSize: '1.02rem',
              color: '#64748b',
              lineHeight: 1.65,
              marginBottom: '1.5rem'
            }}>
              {featSec?.subtitle || 'Transform any iOS or Android tablet or smartphone into a responsive wireless robot cockpit. Features virtual dual-axis joysticks, gravity tilt steering, ultrasonic radar obstacle visualization, and customizable telemetry dials.'}
            </p>

            {featSec?.description && (
              <p style={{ color: '#94a3b8', fontSize: '0.92rem', margin: '-0.75rem 0 1.25rem 0', lineHeight: 1.5 }}>
                {featSec.description}
              </p>
            )}

            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.25rem', padding: 0, listStyle: 'none' }}>
              {featSec?.content?.items && Array.isArray(featSec.content.items) ? (
                featSec.content.items.map((it, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: '#334155', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    <span style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(249, 115, 22, 0.12)',
                      color: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      <IconCheck size={13} />
                    </span>
                    <span><strong style={{ color: '#0f172a' }}>{it.title}:</strong> {it.desc}</span>
                  </li>
                ))
              ) : (
                <>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: '#334155', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    <span style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(249, 115, 22, 0.12)',
                      color: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      <IconCheck size={13} />
                    </span>
                    <span><strong style={{ color: '#0f172a' }}>Bluetooth BLE:</strong> Auto-pairing with zero configuration &amp; low latency.</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: '#334155', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    <span style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(249, 115, 22, 0.12)',
                      color: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      <IconCheck size={13} />
                    </span>
                    <span><strong style={{ color: '#0f172a' }}>Kinematics Sliders:</strong> 4-DOF Robot Arm inverse kinematics posture control.</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: '#334155', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    <span style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(249, 115, 22, 0.12)',
                      color: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      <IconCheck size={13} />
                    </span>
                    <span><strong style={{ color: '#0f172a' }}>IoT Dashboard:</strong> Smart Home remote control for RFID, LEDs, and Fan modules.</span>
                  </li>
                </>
              )}
            </ul>

            {/* Apple App Store & Google Play Badges */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {featSec?.content?.primaryBtn?.url ? (
                <a
                  href={featSec.content.primaryBtn.url}
                  className="app-store-badge-btn"
                  target={featSec.content.primaryBtn.url.startsWith('http') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  aria-label="Download Oxybott Mobile on the Apple App Store"
                >
                  <IconApple size={24} />
                  <div>
                    <div className="badge-sub">Download on the</div>
                    <div className="badge-title">App Store</div>
                  </div>
                </a>
              ) : (
                <button
                  type="button"
                  className="app-store-badge-btn"
                  onClick={() => showToast('Redirecting to Apple App Store for Oxybott Mobile...')}
                  aria-label="Download Oxybott Mobile on the Apple App Store"
                >
                  <IconApple size={24} />
                  <div>
                    <div className="badge-sub">Download on the</div>
                    <div className="badge-title">App Store</div>
                  </div>
                </button>
              )}

              {featSec?.content?.secondaryBtn?.url ? (
                <a
                  href={featSec.content.secondaryBtn.url}
                  className="app-store-badge-btn"
                  target={featSec.content.secondaryBtn.url.startsWith('http') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  aria-label="Get Oxybott Mobile on Google Play"
                >
                  <IconGooglePlay size={20} />
                  <div>
                    <div className="badge-sub">GET IT ON</div>
                    <div className="badge-title">Google Play</div>
                  </div>
                </a>
              ) : (
                <button
                  type="button"
                  className="app-store-badge-btn"
                  onClick={() => showToast('Redirecting to Google Play for Oxybott Mobile...')}
                  aria-label="Get Oxybott Mobile on Google Play"
                >
                  <IconGooglePlay size={20} />
                  <div>
                    <div className="badge-sub">GET IT ON</div>
                    <div className="badge-title">Google Play</div>
                  </div>
                </button>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <img
              src="/assets/images/banner-app.webp"
              alt="Oxybott Mobile App Controller"
              style={{
                maxWidth: '100%',
                borderRadius: '20px',
                boxShadow: '0 20px 45px -12px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(15, 23, 42, 0.05)'
              }}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
