import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { StoreAPI, CMSAPI } from '../services/api';
import { IconArrowRight, IconVideo } from '../components/common/Icons';

const DEFAULT_TUTORIALS = [
  {
    id: 'tut-qd022',
    product_id: 'qd022',
    lesson_tag: 'Lesson 01 • 24 Mins',
    title: 'Oxybott QD022 4-DOF Robot Arm Mechanical Assembly & Servo Zeroing',
    description: 'Learn how to correctly assemble the laser-cut acrylic chassis, mount the 4 metal-gear servos, and calibrate zero angles before powering on.',
    thumbnail_url: '/assets/images/qd022-robot-arm.png',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    product_slug: 'qd022'
  },
  {
    id: 'tut-qd001',
    product_id: 'qd001',
    lesson_tag: 'Lesson 02 • 18 Mins',
    title: 'Oxybott QD001 Mecanum Wheel Car: Line Tracking & Ultrasonic Ranging',
    description: 'Assemble the 4-wheel independent motor drive and configure the 3-channel infrared line tracker using OxyCode block logic.',
    thumbnail_url: '/assets/images/qd001-robot-car.png',
    product_slug: 'qd001'
  },
  {
    id: 'tut-qe011',
    product_id: 'qe011',
    lesson_tag: 'Lesson 03 • 15 Mins',
    title: 'Oxybott QE011 Weather Station: Wi-Fi IoT Cloud Telemetry with ThingSpeak',
    description: 'Connect your ESP32 to home or school Wi-Fi and push live atmospheric temperature, humidity, and raindrop data to an online dashboard.',
    thumbnail_url: '/assets/images/qe011-weather-station.png',
    product_slug: 'qe011'
  },
  {
    id: 'tut-qe001',
    product_id: 'qe001',
    lesson_tag: 'Lesson 04 • 22 Mins',
    title: 'Oxybott QE001 Smart Home: RFID Keyfob Door Locks & Gas Leak Buzzer Alarm',
    description: 'Build an automated smart home security model. Read RFID cards, trigger servo deadbolts, and wire analog gas/smoke detectors.',
    thumbnail_url: '/assets/images/qe001-smart-home.png',
    product_slug: 'qe001'
  },
  {
    id: 'tut-qd020',
    product_id: 'qd020',
    lesson_tag: 'Lesson 05 • 30 Mins',
    title: 'Oxybott QD020 Quadruped Spider: 8-Servo Bio-inspired Gait Programming',
    description: 'Step-by-step calibration of 8 servos. Implement crawl kinematics, self-stabilization, and smartphone Bluetooth posture navigation.',
    thumbnail_url: '/assets/images/qd020-spider-robot.png',
    product_slug: 'qd020'
  },
  {
    id: 'tut-qe200',
    product_id: 'qe200',
    lesson_tag: 'Lesson 06 • 12 Mins',
    title: "Oxybott QE200 ESP32 Starter: From 'Blink LED' to Web Server Hosting",
    description: 'Master foundational breadboard circuitry, pull-up resistors, active buzzer tones, and host an interactive HTML web server on ESP32.',
    thumbnail_url: '/assets/images/qe200-starter-kit.jpg',
    product_slug: 'qe200'
  }
];

function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return `https://www.youtube-nocookie.com/embed/${match[2]}?autoplay=1`;
  }
  return null;
}

const formatImgSrc = (url) => {
  if (!url) return '/assets/images/oxybott_logo.webp';
  if (typeof url !== 'string') return '/assets/images/oxybott_logo.webp';
  if (url.startsWith('http') || url.startsWith('/')) return url;
  return `/${url}`;
};

export default function TutorialsPage() {
  const { showToast } = useToast();
  const [tutorials, setTutorials] = useState(DEFAULT_TUTORIALS);
  const [cmsPage, setCmsPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeVideoTutorial, setActiveVideoTutorial] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [tutRes, pageRes] = await Promise.allSettled([
        StoreAPI.getTutorials(),
        CMSAPI.getPage('tutorials')
      ]);

      if (tutRes.status === 'fulfilled' && tutRes.value?.success && tutRes.value?.tutorials?.length > 0) {
        setTutorials(tutRes.value.tutorials);
      }
      if (pageRes.status === 'fulfilled' && pageRes.value?.page) {
        setCmsPage(pageRes.value.page);
      }
    } catch (err) {
      console.warn('Could not load dynamic tutorials or CMS page:', err);
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

  const handleVideoClick = (tut) => {
    const hasYt = tut.video_url && getYouTubeEmbedUrl(tut.video_url);
    const hasFile = Boolean(tut.video_file_path);

    if (hasYt || hasFile) {
      setActiveVideoTutorial(tut);
    } else if (tut.video_url) {
      window.open(tut.video_url, '_blank', 'noopener,noreferrer');
    } else {
      showToast(`Video tutorial for "${tut.title}" is currently being prepared. Check back soon!`);
    }
  };

  const handleDownload = (filename) => {
    showToast(`Downloading ${filename}...`);
  };

  const filteredTutorials = tutorials.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.lesson_tag && t.lesson_tag.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.product_name && t.product_name.toLowerCase().includes(q))
    );
  });

  return (
    <>
      {/* Banner */}
      <section style={{ background: 'linear-gradient(135deg, #071526 0%, #0c2340 100%)', color: 'var(--oxy-white)', padding: '4.5rem 0', textAlign: 'center' }}>
        <div className="container container-narrow">
          <span className="section-tag" style={{ background: 'rgba(0, 153, 255, 0.2)', color: '#7dd3fc' }}>
            {cmsPage?.sections?.hero?.tag || 'Knowledge Base'}
          </span>
          <h1 style={{ color: 'var(--oxy-white)', marginBottom: '1rem' }}>
            {cmsPage?.sections?.hero?.title || 'Oxybott Tutorials & Assembly Guides'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.15rem', lineHeight: 1.6 }}>
            {cmsPage?.sections?.hero?.subtitle || 'Master your Oxybott robotics kits with clear, step-by-step video instructions, color pinout diagrams, and open-source sample code.'}
          </p>
          {cmsPage?.sections?.hero?.description && (
            <p style={{ color: '#cbd5e1', fontSize: '1rem', marginTop: '0.75rem', lineHeight: 1.6 }}>
              {cmsPage.sections.hero.description}
            </p>
          )}
        </div>
      </section>

      {/* Tutorials Grid */}
      <main className="container" style={{ paddingTop: '3.5rem', paddingBottom: '6rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div className="section-header" style={{ margin: 0, textAlign: 'left' }}>
            <span className="section-tag orange">{cmsPage?.sections?.featured?.tag || 'Step-by-Step Build Videos'}</span>
            <h2 className="section-title" style={{ margin: '0.25rem 0 0 0' }}>
              {cmsPage?.sections?.featured?.title || 'Featured Assembly & Coding Guides'}
            </h2>
            {cmsPage?.sections?.featured?.subtitle && (
              <p style={{ color: 'var(--oxy-gray-600)', fontSize: '0.95rem', margin: '0.35rem 0 0 0' }}>
                {cmsPage.sections.featured.subtitle}
              </p>
            )}
            {cmsPage?.sections?.featured?.description && (
              <p style={{ color: 'var(--oxy-gray-500)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                {cmsPage.sections.featured.description}
              </p>
            )}
          </div>

          <div style={{ maxWidth: '320px', width: '100%' }}>
            <input
              type="text"
              placeholder="Search tutorials & kits..."
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '0.65rem 1.25rem',
                border: '1px solid var(--oxy-gray-300)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--oxy-gray-500)' }}>
            Loading tutorials &amp; videos...
          </div>
        ) : filteredTutorials.length === 0 ? (
          <div style={{
            background: 'var(--oxy-gray-50)',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem',
            textAlign: 'center',
            border: '1px dashed var(--oxy-gray-300)'
          }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--oxy-gray-600)', margin: 0 }}>
              No tutorials match your search &quot;{search}&quot;.
            </p>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setSearch('')} style={{ marginTop: '1rem' }}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="tutorial-grid">
            {filteredTutorials.map(tut => {
              const hasVideo = Boolean(tut.video_url || tut.video_file_path);
              const targetProduct = tut.product_slug || tut.product_id;

              return (
                <div key={tut.id} className="tutorial-card">
                  <div
                    className="tutorial-media"
                    onClick={() => handleVideoClick(tut)}
                    style={{ cursor: 'pointer', position: 'relative' }}
                    title={hasVideo ? 'Click to watch tutorial video' : tut.title}
                  >
                    <img
                      src={formatImgSrc(tut.thumbnail_url || tut.img)}
                      alt={tut.title}
                      className="tutorial-thumb"
                      style={{ objectFit: 'contain', background: '#0c2340', padding: '1.5rem', width: '100%', height: '220px' }}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="play-badge" style={{ background: hasVideo ? '#ef4444' : 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginLeft: 2 }} aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  <div className="tutorial-card-body">
                    <div className="tutorial-time" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{tut.lesson_tag || tut.lesson}</span>
                      {hasVideo && (
                        <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <IconVideo size={12} />
                          <span>Video Available</span>
                        </span>
                      )}
                    </div>
                    <h3 className="tutorial-title">{tut.title}</h3>
                    <p className="tutorial-desc">{tut.description || tut.desc}</p>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleVideoClick(tut)}
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        Watch Video
                      </button>
                      {targetProduct ? (
                        <Link to={`/products/${targetProduct}`} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                          Kit Details
                        </Link>
                      ) : (
                        <Link to="/products" className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                          Browse Kits
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Code & Schematics Download Section */}
        <section id="code" style={{ background: 'var(--oxy-gray-50)', border: '1px solid var(--oxy-gray-200)', borderRadius: 'var(--radius-xl)', padding: '3.5rem 2.5rem', textAlign: 'center', marginTop: '4rem' }}>
          <span className="section-tag">Open Source Hub</span>
          <h2 style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>Official Code Repositories &amp; PDF Schematics</h2>
          <p style={{ color: 'var(--oxy-gray-600)', maxWidth: '650px', margin: '0 auto 2rem' }}>
            All Oxybott hardware and code examples are 100% open-source. Download complete libraries, wiring schematics, and teacher curriculum guides.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleDownload('Oxybott_Master_Arduino_Library.zip')}
            >
              Download Arduino Library (.zip)
            </button>
            <button
              type="button"
              className="btn btn-orange"
              onClick={() => handleDownload('OxyCode_Sample_Projects.zip')}
            >
              Download OxyCode Blocks (.zip)
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => handleDownload('Complete_Schematics_PDF.zip')}
            >
              Wiring Schematics (.pdf)
            </button>
          </div>
        </section>
      </main>

      {/* Interactive Video Player Modal Overlay */}
      {activeVideoTutorial && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 15, 30, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setActiveVideoTutorial(null)}
        >
          <div
            style={{
              background: '#0b192c',
              color: '#fff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '850px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--oxy-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {activeVideoTutorial.lesson_tag || 'Build Tutorial'}
                </span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.15rem', color: '#fff' }}>
                  {activeVideoTutorial.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoTutorial(null)}
                aria-label="Close modal"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'color 150ms ease'
                }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Video Player Display */}
            <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000' }}>
              {activeVideoTutorial.video_url && getYouTubeEmbedUrl(activeVideoTutorial.video_url) ? (
                <iframe
                  src={getYouTubeEmbedUrl(activeVideoTutorial.video_url)}
                  title={activeVideoTutorial.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                />
              ) : activeVideoTutorial.video_file_path ? (
                <video
                  controls
                  autoPlay
                  preload="metadata"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  src={activeVideoTutorial.video_file_path}
                >
                  Your browser does not support HTML5 video.
                </video>
              ) : null}
            </div>

            {/* Modal Footer / Details */}
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: '#071526' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', maxWidth: '520px', lineHeight: 1.5 }}>
                {activeVideoTutorial.description}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {(activeVideoTutorial.product_slug || activeVideoTutorial.product_id) && (
                  <Link
                    to={`/products/${activeVideoTutorial.product_slug || activeVideoTutorial.product_id}`}
                    className="btn btn-primary btn-sm"
                    onClick={() => setActiveVideoTutorial(null)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <span>View Robotics Kit</span>
                    <IconArrowRight size={13} />
                  </Link>
                )}
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
                  onClick={() => setActiveVideoTutorial(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
