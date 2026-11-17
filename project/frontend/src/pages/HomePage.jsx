import React, { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { StoreAPI, CMSAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import CodeStudio from '../components/home/CodeStudio';
import {
  IconCheck,
  IconStar,
  IconSettings,
  IconTruck,
  IconRobot,
  IconBookOpen,
  IconShieldCheck,
  IconLightning,
  IconExternalLink,
  IconArrowRight
} from '../components/common/Icons';

export default function HomePage() {
  const { products, formatPrice, refreshStore } = useStore();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const { onOpenQuote } = useOutletContext() || {};

  const [activeFilter, setActiveFilter] = useState('all');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [cmsPage, setCmsPage] = useState(null);

  // Load latest CMS page sections
  const loadCms = useCallback(async () => {
    try {
      const res = await CMSAPI.getPage('home');
      if (res.success && res.page) {
        setCmsPage(res.page);
      }
    } catch (e) {
      console.warn('Could not load CMS home page, using defaults:', e);
    }
  }, []);

  // Fetch CMS and listen for live admin updates
  useEffect(() => {
    refreshStore();
    loadCms();

    const handleCmsSync = () => {
      loadCms();
    };
    const handleStorage = (e) => {
      if (e.key === 'oxybott_cms_sync' || e.key === 'oxybott_settings_sync') {
        loadCms();
      }
    };

    window.addEventListener('oxybott_cms_updated', handleCmsSync);
    window.addEventListener('oxybott_settings_updated', handleCmsSync);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('oxybott_cms_updated', handleCmsSync);
      window.removeEventListener('oxybott_settings_updated', handleCmsSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshStore, loadCms]);

  // Hero Product (Custom from CMS or default to QD022)
  const heroProductId = cmsPage?.sections?.hero?.content?.product_id || 'qd022';
  const heroProduct = products.find(p => p.id === heroProductId || p.slug === heroProductId) || products[0] || {
    id: 'qd022',
    name: 'Oxybott QD022 4-DOF Programmable Robot Arm Kit',
    price: 7469,
    originalPrice: 9129
  };

  const formatHeroImgSrc = (url) => {
    if (!url) return '/assets/images/qd022-robot-arm.png';
    if (typeof url !== 'string') return '/assets/images/qd022-robot-arm.png';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return url;
    if (url.startsWith('/')) return url;
    return `/${url}`;
  };

  const heroImageSrc = formatHeroImgSrc(
    cmsPage?.sections?.hero?.content?.hero_image || heroProduct?.image || heroProduct?.main_image || '/assets/images/qd022-robot-arm.png'
  );

  const filteredProducts = products.filter(p => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'Robotics') return p.category === 'Robotics';
    if (activeFilter === 'Smart IoT') return p.category === 'Smart IoT';
    if (activeFilter === 'Classroom Sets') return p.category === 'Classroom Sets';
    if (activeFilter === 'Electronics') return p.category === 'Electronics';
    return true;
  }).slice(0, 8);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    try {
      await StoreAPI.submitInquiry({
        type: 'newsletter',
        email: newsletterEmail.trim(),
        subject: 'Newsletter Subscription'
      });
      showToast('Thank you! Your curriculum catalog and lesson plans are on the way.');
      setNewsletterEmail('');
    } catch {
      showToast('Subscribed successfully! Thank you.');
      setNewsletterEmail('');
    }
  };

  return (
    <main id="mainContent">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-grid">
          {/* Left Column: Copy & Actions */}
          <div className="hero-content">
            <div className="hero-pill">
              <span>{cmsPage?.sections?.hero?.tag || 'Next-Gen STEM & ESP32 Robotics'}</span>
            </div>
            <h1 className="hero-title">
              {cmsPage?.sections?.hero?.title ? (
                cmsPage.sections.hero.title
              ) : (
                <>Build, Code &amp; Innovate with <span className="hero-title-highlight">Oxybott STEM</span> Kits</>
              )}
            </h1>
            <p className="hero-lead">
              {cmsPage?.sections?.hero?.subtitle || 'Ignite creativity in classrooms, maker labs, and at home. From 4-DOF robotic arms to smart IoT eco-systems, Oxybott delivers open-source hardware powered by block-based OxyCode, Arduino C++, and MicroPython.'}
            </p>

            {/* Description / Extra Paragraph */}
            {cmsPage?.sections?.hero?.description && (
              <p className="hero-description" style={{ color: 'var(--oxy-gray-600)', fontSize: '1.05rem', marginTop: '-0.35rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                {cmsPage.sections.hero.description}
              </p>
            )}

            <div className="hero-buttons">
              {(() => {
                const heroContent = cmsPage?.sections?.hero?.content || {};
                const pBtn = heroContent.primaryBtn;
                const pText = pBtn?.text || 'Explore All Kits →';
                const pUrl = pBtn?.url || '/products';
                const sBtn = heroContent.secondaryBtn;
                const sText = sBtn?.text || 'Education Solutions';
                const sUrl = sBtn?.url || '/education';
                const tText = heroContent.tertiaryBtn?.text || heroContent.quoteBtn?.text || 'Apply for School Trial';

                return (
                  <>
                    {pUrl.startsWith('http') ? (
                      <a href={pUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">{pText}</a>
                    ) : (
                      <Link to={pUrl} className="btn btn-primary btn-lg">{pText}</Link>
                    )}

                    {sUrl.startsWith('http') ? (
                      <a href={sUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-lg">{sText}</a>
                    ) : (
                      <Link to={sUrl} className="btn btn-outline btn-lg">{sText}</Link>
                    )}

                    <button
                      type="button"
                      className="btn btn-orange btn-lg quote-modal-trigger"
                      onClick={onOpenQuote}
                    >
                      {tText}
                    </button>
                  </>
                );
              })()}
            </div>

            <div className="hero-badges-row">
              {cmsPage?.sections?.hero?.content?.stats && Array.isArray(cmsPage.sections.hero.content.stats) ? (
                cmsPage.sections.hero.content.stats.slice(0, 3).map((st, idx) => (
                  <div key={idx} className="hero-badge-item">
                    <div className="hero-badge-icon">
                      {idx === 0 ? <IconCheck size={16} /> : idx === 1 ? <IconStar size={16} fill="currentColor" /> : <IconSettings size={16} />}
                    </div>
                    <div className="hero-badge-text">
                      {st.value && <strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--oxy-navy)' }}>{st.value}</strong>}
                      <span>{st.label}</span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="hero-badge-item">
                    <div className="hero-badge-icon"><IconCheck size={16} /></div>
                    <div className="hero-badge-text">100% Open Source<br />ESP32 Ecosystem</div>
                  </div>
                  <div className="hero-badge-item">
                    <div className="hero-badge-icon"><IconStar size={16} fill="currentColor" /></div>
                    <div className="hero-badge-text">24+ Standards-Aligned<br />Classroom Lessons</div>
                  </div>
                  <div className="hero-badge-item">
                    <div className="hero-badge-icon"><IconSettings size={16} /></div>
                    <div className="hero-badge-text">No-Solder Anti-Reverse<br />Easy-Plug Cabling</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Visual Showcase */}
          <div className="hero-visual">
            <div className="hero-visual-card">
              <img
                src={heroImageSrc}
                alt={heroProduct.name || "Oxybott Robot Kit"}
                className="hero-main-img"
                width="400"
                height="400"
                fetchPriority="high"
                style={{ objectFit: 'contain' }}
              />

              <h3 style={{ fontSize: '1.35rem', color: 'var(--oxy-navy)', marginBottom: '0.25rem' }}>
                {heroProduct.name}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--oxy-gray-500)', marginBottom: '1rem' }}>
                {heroProduct.tagline || heroProduct.description || 'ESP32 Dual-Core • Wireless Wi-Fi/BLE • 4 Metal-Gear Servos'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '0.75rem' }}>
                <span id="heroCardPrice" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--oxy-orange)', fontFamily: 'var(--font-heading)' }}>
                  {formatPrice(heroProduct.price || 7469)}
                </span>
                <span id="heroCardOriginalPrice" style={{ textDecoration: 'line-through', color: 'var(--oxy-gray-400)', fontSize: '1rem' }}>
                  {formatPrice(heroProduct.originalPrice || 9129)}
                </span>
                {heroProduct.osemi_url ? (
                  <a
                    href={heroProduct.osemi_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <span>Buy on OSEMI</span>
                    <IconExternalLink size={13} />
                  </a>
                ) : (
                  <Link to={`/products/${heroProduct.id || 'qd022'}`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Explore Kit</span>
                    <IconArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions Bar */}
      <section className="value-props-bar">
        <div className="container props-grid">
          {cmsPage?.sections?.features?.content?.items && Array.isArray(cmsPage.sections.features.content.items) ? (
            cmsPage.sections.features.content.items.map((it, idx) => (
              <div key={idx} className="prop-card">
                <div className="prop-icon-wrap">
                  {idx === 0 ? <IconTruck size={22} /> : idx === 1 ? <IconRobot size={22} /> : idx === 2 ? <IconBookOpen size={22} /> : <IconShieldCheck size={22} />}
                </div>
                <div>
                  <h4 className="prop-title">{it.title}</h4>
                  <p className="prop-desc">{it.desc}</p>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="prop-card">
                <div className="prop-icon-wrap"><IconTruck size={22} /></div>
                <div>
                  <h4 className="prop-title">Free Nationwide Shipping</h4>
                  <p className="prop-desc">Complimentary priority delivery on orders over ₹999</p>
                </div>
              </div>
              <div className="prop-card">
                <div className="prop-icon-wrap"><IconRobot size={22} /></div>
                <div>
                  <h4 className="prop-title">Easy-Plug Wiring</h4>
                  <p className="prop-desc">Anti-reverse modular cables ensure 100% safe school builds</p>
                </div>
              </div>
              <div className="prop-card">
                <div className="prop-icon-wrap"><IconBookOpen size={22} /></div>
                <div>
                  <h4 className="prop-title">Curriculum Standards</h4>
                  <p className="prop-desc">NGSS &amp; CSTA aligned lesson guides with teacher slides</p>
                </div>
              </div>
              <div className="prop-card">
                <div className="prop-icon-wrap"><IconShieldCheck size={22} /></div>
                <div>
                  <h4 className="prop-title">Certified Safety</h4>
                  <p className="prop-desc">CE, FCC, RoHS, and EN71 certified non-toxic components</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Series Showcase */}
      <section className="series-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{cmsPage?.sections?.series?.tag || 'Curated Collections'}</span>
            <h2 className="section-title">{cmsPage?.sections?.series?.title || 'Explore Oxybott STEM Kit Series'}</h2>
            <p className="section-subtitle">{cmsPage?.sections?.series?.subtitle || 'Specially architected pathways taking students seamlessly from elementary visual block coding to advanced high school robotics.'}</p>
            {cmsPage?.sections?.series?.description && (
              <p style={{ color: 'var(--oxy-gray-500)', fontSize: '0.95rem', marginTop: '0.5rem' }}>{cmsPage.sections.series.description}</p>
            )}
          </div>

          <div className="series-grid">
            {/* Explorer Series */}
            <div className="series-card">
              <div className="series-card-media">
                <span className="series-badge">Ages 8-12</span>
                <img src="/assets/images/qd001-robot-car.png" alt="Explorer Series" className="series-img" loading="lazy" decoding="async" />
              </div>
              <div className="series-card-body">
                <h3 className="series-name">Explorer Series</h3>
                <div className="series-target">For Beginners &amp; Young Creators</div>
                <p className="series-description">Interactive smart cars, weather stations, and smart home kits designed for intuitive graphical block programming.</p>
                <Link to="/products?series=Explorer+Series" className="series-link-btn">
                  <span>View Explorer Kits</span>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M6 12L10 8L6 4" strokeWidth="2"/></svg>
                </Link>
              </div>
            </div>

            {/* Education Series */}
            <div className="series-card">
              <div className="series-card-media">
                <span className="series-badge" style={{ backgroundColor: 'var(--oxy-orange)' }}>Classroom Sets</span>
                <img src="/assets/images/qe023-smart-home-edu.png" alt="Education Series" className="series-img" loading="lazy" decoding="async" />
              </div>
              <div className="series-card-body">
                <h3 className="series-name">Education Series</h3>
                <div className="series-target">For Teachers &amp; STEM Schools</div>
                <p className="series-description">Magnetic demonstration boards, full classroom kits, multi-week lesson plans, student rubrics, and storage organizers.</p>
                <Link to="/education" className="series-link-btn">
                  <span>Classroom Solutions</span>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M6 12L10 8L6 4" strokeWidth="2"/></svg>
                </Link>
              </div>
            </div>

            {/* Inventor Series */}
            <div className="series-card">
              <div className="series-card-media">
                <span className="series-badge" style={{ backgroundColor: 'var(--oxy-purple)' }}>Ages 12-18</span>
                <img src="/assets/images/qd022-robot-arm.png" alt="Inventor Series" className="series-img" loading="lazy" decoding="async" />
              </div>
              <div className="series-card-body">
                <h3 className="series-name">Inventor Series</h3>
                <div className="series-target">For Makers &amp; Young Engineers</div>
                <p className="series-description">High-precision 4-axis robotic arms, biped walking bipeds, and 8-servo quadruped spiders with inverse kinematics.</p>
                <Link to="/products?series=Inventor+Series" className="series-link-btn">
                  <span>View Robotics Kits</span>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M6 12L10 8L6 4" strokeWidth="2"/></svg>
                </Link>
              </div>
            </div>

            {/* Maker Series */}
            <div className="series-card">
              <div className="series-card-media">
                <span className="series-badge" style={{ backgroundColor: 'var(--oxy-green)' }}>All Ages</span>
                <img src="/assets/images/qe200-starter-kit.jpg" alt="Maker Series" className="series-img" loading="lazy" decoding="async" />
              </div>
              <div className="series-card-body">
                <h3 className="series-name">Maker Series</h3>
                <div className="series-target">Electronics &amp; Sensor Labs</div>
                <p className="series-description">Comprehensive breadboard starter sets, 37-in-1 sensor expansions, and genuine ESP32 dual-core developer boards.</p>
                <Link to="/products?series=Maker+Series" className="series-link-btn">
                  <span>View Maker Kits</span>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M6 12L10 8L6 4" strokeWidth="2"/></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products with Category Filters */}
      <section className="products-section" id="featuredProducts">
        <div className="container">
          <div className="section-header">
            <span className="section-tag orange">Hands-on Hardware</span>
            <h2 className="section-title">Featured Oxybott STEM Kits</h2>
            <p className="section-subtitle">Real, tested robotics and sensor electronics backed by comprehensive tutorials and community support.</p>
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button
              type="button"
              className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Kits
            </button>
            <button
              type="button"
              className={`filter-tab ${activeFilter === 'Robotics' ? 'active' : ''}`}
              onClick={() => setActiveFilter('Robotics')}
            >
              Robotics
            </button>
            <button
              type="button"
              className={`filter-tab ${activeFilter === 'Smart IoT' ? 'active' : ''}`}
              onClick={() => setActiveFilter('Smart IoT')}
            >
              Smart IoT
            </button>
            <button
              type="button"
              className={`filter-tab ${activeFilter === 'Classroom Sets' ? 'active' : ''}`}
              onClick={() => setActiveFilter('Classroom Sets')}
            >
              Classroom Sets
            </button>
            <button
              type="button"
              className={`filter-tab ${activeFilter === 'Electronics' ? 'active' : ''}`}
              onClick={() => setActiveFilter('Electronics')}
            >
              Maker Electronics
            </button>
          </div>

          {/* Product Grid */}
          <div className="product-grid" id="homepageProductGrid">
            {filteredProducts.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <Link to="/products" className="btn btn-outline btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Browse Complete Catalog (15+ Kits)</span>
              <IconArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Education Solutions Section */}
      <section className="edu-solutions-section">
        <div className="container edu-grid">
          <div className="edu-content">
            <span className="section-tag">{cmsPage?.sections?.edu_solutions?.tag || 'For K-12 Classrooms'}</span>
            <h2 className="edu-title">{cmsPage?.sections?.edu_solutions?.title || 'Transform Your STEM Curriculum with Oxybott Solutions'}</h2>
            <p className="edu-description">
              {cmsPage?.sections?.edu_solutions?.description || 'We partner with educators, public school districts, and maker hubs worldwide. Our all-in-one educational packages feature durable anti-reverse modular wiring, magnetic whiteboard demonstration surfaces, ready-to-teach PowerPoint slides, and student assessment rubrics.'}
            </p>

            <div className="edu-features-list">
              <div className="edu-feature-item">
                <div className="edu-feature-icon"><IconCheck size={16} /></div>
                <div>
                  <h4 className="edu-feature-title">Modular Anti-Reverse Easy-Plug Wiring</h4>
                  <p className="edu-feature-desc">Color-coded 4-pin cables eliminate dangerous short circuits and burnt boards during energetic 45-minute lab sessions.</p>
                </div>
              </div>

              <div className="edu-feature-item">
                <div className="edu-feature-icon"><IconCheck size={16} /></div>
                <div>
                  <h4 className="edu-feature-title">CSTA &amp; NGSS Aligned Curriculum Units</h4>
                  <p className="edu-feature-desc">Comprehensive teacher guides, downloadable code repositories, and homework challenges covering grades 3 through 12.</p>
                </div>
              </div>

              <div className="edu-feature-item">
                <div className="edu-feature-icon"><IconCheck size={16} /></div>
                <div>
                  <h4 className="edu-feature-title">Free School Evaluation Samples &amp; Bulk Grants</h4>
                  <p className="edu-feature-desc">Verified schools and STEM academies qualify for free hands-on teacher preview kits and substantial institutional volume discounts.</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to={cmsPage?.sections?.edu_solutions?.content?.primaryBtn?.url || "/education"} className="btn btn-primary btn-lg">
                {cmsPage?.sections?.edu_solutions?.content?.primaryBtn?.text || 'Explore Education Kits →'}
              </Link>
              <button
                type="button"
                className="btn btn-outline-white btn-lg quote-modal-trigger"
                onClick={onOpenQuote}
              >
                {cmsPage?.sections?.edu_solutions?.content?.secondaryBtn?.text || 'Apply for School Discount'}
              </button>
            </div>
          </div>

          <div className="edu-visual">
            <div className="edu-image-card">
              <img
                src={cmsPage?.sections?.edu_solutions?.content?.image_url || "/assets/images/qe023-smart-home-edu.png"}
                alt={cmsPage?.sections?.edu_solutions?.content?.card_title || "Oxybott Education Ecosystem"}
                className="edu-main-img"
                loading="lazy"
                decoding="async"
              />
              <h3 style={{ color: 'var(--oxy-white)', fontSize: '1.35rem', marginBottom: '0.5rem' }}>
                {cmsPage?.sections?.edu_solutions?.content?.card_title || 'Modular Magnetic Teaching System'}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                {cmsPage?.sections?.edu_solutions?.content?.card_desc || 'Clean tabletop display boxes with laser-cut modular mounting plates.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Software Suite & Interactive Code Studio */}
      <CodeStudio cmsSection={cmsPage?.sections?.software_spotlight} />

      {/* STEM Curriculum Roadmap */}
      <section className="curriculum-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag orange">{cmsPage?.sections?.curriculum?.tag || 'Progressive Learning'}</span>
            <h2 className="section-title">{cmsPage?.sections?.curriculum?.title || 'Oxybott K-12 STEM Curriculum Pathway'}</h2>
            <p className="section-subtitle">{cmsPage?.sections?.curriculum?.subtitle || 'Structured progression designed to nurture problem-solving, computational thinking, and hands-on mechatronic engineering.'}</p>
            {cmsPage?.sections?.curriculum?.description && (
              <p style={{ color: 'var(--oxy-gray-500)', fontSize: '0.95rem', marginTop: '0.5rem' }}>{cmsPage.sections.curriculum.description}</p>
            )}
          </div>

          <div className="roadmap-grid">
            {/* Grade 3-5 */}
            <div className="roadmap-card">
              <div className="roadmap-step">Stage 1 &bull; Elementary</div>
              <h3 className="roadmap-title">Coding Discovery</h3>
              <div className="roadmap-age">Ages 8-10 &bull; Grade 3-5</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--oxy-gray-600)' }}>
                Visual drag-and-drop block coding. Students assemble basic obstacle cars and weather stations without soldering.
              </p>
              <div className="roadmap-skills">
                <div className="roadmap-skill-item">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.485 1.929a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L6 8.586l6.293-6.293a1 1 0 011.414 0z"/></svg> Basic logic &amp; sequential loops
                </div>
                <div className="roadmap-skill-item">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.485 1.929a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L6 8.586l6.293-6.293a1 1 0 011.414 0z"/></svg> Ultrasonic distance &amp; light detection
                </div>
                <div className="roadmap-skill-item">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.485 1.929a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L6 8.586l6.293-6.293a1 1 0 011.414 0z"/></svg> Oxybott QD001 &amp; QE011 Kits
                </div>
              </div>
            </div>

            {/* Grade 6-8 */}
            <div className="roadmap-card">
              <div className="roadmap-step">Stage 2 &bull; Middle School</div>
              <h3 className="roadmap-title">Smart IoT &amp; Automation</h3>
              <div className="roadmap-age">Ages 11-13 &bull; Grade 6-8</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--oxy-gray-600)' }}>
                Introduction to wireless IoT networks, cloud telemetry, RFID door access, and smart city traffic intersections.
              </p>
              <div className="roadmap-skills">
                <div className="roadmap-skill-item">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.485 1.929a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L6 8.586l6.293-6.293a1 1 0 011.414 0z"/></svg> Wi-Fi MQTT &amp; cloud dashboards
                </div>
                <div className="roadmap-skill-item">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.485 1.929a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L6 8.586l6.293-6.293a1 1 0 011.414 0z"/></svg> RFID security &amp; sensor integration
                </div>
                <div className="roadmap-skill-item">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.485 1.929a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L6 8.586l6.293-6.293a1 1 0 011.414 0z"/></svg> Oxybott QE001 &amp; QE023 Kits
                </div>
              </div>
            </div>

            {/* Grade 9-12 */}
            <div className="roadmap-card">
              <div className="roadmap-step">Stage 3 &bull; High School</div>
              <h3 className="roadmap-title">Robotics &amp; Kinematics</h3>
              <div className="roadmap-age">Ages 14-18 &bull; Grade 9-12</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--oxy-gray-600)' }}>
                Transition into syntax-based Arduino C++ and Python. Students construct multi-servo robotic arms and bipedal walkers.
              </p>
              <div className="roadmap-skills">
                <div className="roadmap-skill-item">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.485 1.929a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L6 8.586l6.293-6.293a1 1 0 011.414 0z"/></svg> 4-Axis robotic kinematics
                </div>
                <div className="roadmap-skill-item">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.485 1.929a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L6 8.586l6.293-6.293a1 1 0 011.414 0z"/></svg> Arduino C++ &amp; Python scripting
                </div>
                <div className="roadmap-skill-item">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.485 1.929a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L6 8.586l6.293-6.293a1 1 0 011.414 0z"/></svg> Oxybott QD022 &amp; QD021 Kits
                </div>
              </div>
            </div>

            {/* Collegiate / Makers */}
            <div className="roadmap-card">
              <div className="roadmap-step">Stage 4 &bull; Advanced</div>
              <h3 className="roadmap-title">Industry 4.0 &amp; Mechatronics</h3>
              <div className="roadmap-age">Ages 16+ &bull; Vocational &amp; Makers</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--oxy-gray-600)' }}>
                Real-world industrial automation with conveyor belts, autonomous AGV logistics vehicles, and color-sorting machines.
              </p>
              <div className="roadmap-skills">
                <div className="roadmap-skill-item">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.485 1.929a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L6 8.586l6.293-6.293a1 1 0 011.414 0z"/></svg> Industrial conveyor &amp; sorting logic
                </div>
                <div className="roadmap-skill-item">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.485 1.929a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L6 8.586l6.293-6.293a1 1 0 011.414 0z"/></svg> AGV warehouse fleet simulation
                </div>
                <div className="roadmap-skill-item">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.485 1.929a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L6 8.586l6.293-6.293a1 1 0 011.414 0z"/></svg> Oxybott QE037 &amp; QE032 Kits
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials & Academy Endorsements */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{cmsPage?.sections?.testimonials?.tag || 'Educator Voices'}</span>
            <h2 className="section-title">{cmsPage?.sections?.testimonials?.title || 'Trusted by Teachers & STEM Mentors'}</h2>
            <p className="section-subtitle">{cmsPage?.sections?.testimonials?.subtitle || 'Read why leading STEM academies and schools across North America, Europe, and Asia choose Oxybott.'}</p>
            {cmsPage?.sections?.testimonials?.description && (
              <p style={{ color: 'var(--oxy-gray-500)', fontSize: '0.95rem', marginTop: '0.5rem' }}>{cmsPage.sections.testimonials.description}</p>
            )}
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars" style={{ display: 'flex', gap: '3px', color: 'var(--oxy-yellow)', marginBottom: '0.75rem' }}>
                {[...Array(5)].map((_, i) => (
                  <IconStar key={i} size={15} fill="currentColor" />
                ))}
              </div>
              <p className="testimonial-quote">
                &quot;The Oxybott QD022 Robot Arm has completely revolutionized our middle school robotics class. The Easy-Plug wiring eliminated burnt components, and our students were programming kinematics in OxyCode on day one!&quot;
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">MR</div>
                <div>
                  <div className="author-name">Marcus Reynolds</div>
                  <div className="author-role">STEM Department Chair, Lincoln Preparatory</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars" style={{ display: 'flex', gap: '3px', color: 'var(--oxy-yellow)', marginBottom: '0.75rem' }}>
                {[...Array(5)].map((_, i) => (
                  <IconStar key={i} size={15} fill="currentColor" />
                ))}
              </div>
              <p className="testimonial-quote">
                &quot;As an educator running 6 consecutive classes a day, the modular magnetic display boards in the QE023 Smart Home kit save me 20 minutes of setup each period. The curriculum slides and worksheets are phenomenal.&quot;
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">ST</div>
                <div>
                  <div className="author-name">Sarah Thornton</div>
                  <div className="author-role">Computer Science Teacher, Oakridge Academy</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars" style={{ display: 'flex', gap: '3px', color: 'var(--oxy-yellow)', marginBottom: '0.75rem' }}>
                {[...Array(5)].map((_, i) => (
                  <IconStar key={i} size={15} fill="currentColor" />
                ))}
              </div>
              <p className="testimonial-quote">
                &quot;The ESP32 ecosystem is so much more practical for 21st-century IoT skills than legacy 8-bit microcontrollers. Oxybott offers the best open-source documentation and video assembly guides I have ever experienced.&quot;
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">DL</div>
                <div>
                  <div className="author-name">Dr. David Liu</div>
                  <div className="author-role">Director of Robotics, Pacific Innovation Lab</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter & Call to Action Banner */}
      <section className="cta-banner-section">
        <div className="container cta-banner-box">
          <h2 className="cta-banner-title">{cmsPage?.sections?.cta?.title || 'Ready to Inspire Your Students?'}</h2>
          <p className="cta-banner-desc">{cmsPage?.sections?.cta?.subtitle || 'Get our 2026 STEM Curriculum Catalog, teacher discounts, and free lesson plans sent directly to your inbox.'}</p>
          {cmsPage?.sections?.cta?.description && (
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: '-0.5rem auto 1.25rem', maxWidth: '600px' }}>
              {cmsPage.sections.cta.description}
            </p>
          )}

          <form className="newsletter-form" onSubmit={handleNewsletter}>
            <input
              type="email"
              placeholder="Enter your educational or work email"
              required
              className="newsletter-input"
              value={newsletterEmail}
              onChange={e => setNewsletterEmail(e.target.value)}
            />
            <button type="submit" className="btn btn-orange">
              {cmsPage?.sections?.cta?.content?.primaryBtn?.text || 'Subscribe & Get Guide'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
