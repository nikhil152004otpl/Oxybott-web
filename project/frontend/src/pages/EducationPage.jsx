import React, { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { StoreAPI, CMSAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { IconArrowRight } from '../components/common/Icons';

export default function EducationPage() {
  const { onOpenQuote } = useOutletContext() || {};
  const { showToast } = useToast();
  const [cmsPage, setCmsPage] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const res = await CMSAPI.getPage('education');
      if (res.success && res.page) {
        setCmsPage(res.page);
      }
    } catch (e) {
      console.warn('Could not load education CMS page, using defaults:', e);
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

  const [formData, setFormData] = useState({
    educatorName: '',
    email: '',
    schoolName: '',
    role: '',
    grade: 'Elementary School (Grades 3 - 5)',
    kit: 'QE023 Smart Home Classroom Kit',
    address: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.educatorName.trim() || !formData.email.trim() || !formData.schoolName.trim() || !formData.address.trim()) {
      showToast('Please fill in all required fields.', true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await StoreAPI.submitInquiry({
        type: 'trial',
        name: formData.educatorName.trim(),
        email: formData.email.trim(),
        organization: formData.schoolName.trim(),
        subject: `School Trial Application: ${formData.kit}`,
        message: `Evaluation application for ${formData.kit}. Grade level: ${formData.grade}. Title: ${formData.role || 'Educator'}. Shipping to: ${formData.address}`,
        details: { ...formData }
      });

      showToast(res.message || 'Trial application submitted! Our education specialist will review and verify your school credentials.');
      setFormData({
        educatorName: '',
        email: '',
        schoolName: '',
        role: '',
        grade: 'Elementary School (Grades 3 - 5)',
        kit: 'QE023 Smart Home Classroom Kit',
        address: ''
      });
    } catch (err) {
      showToast(err.message || 'Failed to submit trial application. Please check your information.', true);
    } finally {
      setSubmitting(false);
    }
  };

  const heroSec = cmsPage?.sections?.hero;
  const stagesSec = cmsPage?.sections?.stages;
  const labsSec = cmsPage?.sections?.labs;

  return (
    <main id="mainContent">
      {/* Hero */}
      <section className="edu-hero">
        <div className="container container-narrow">
          <span className="section-tag" style={{ background: 'rgba(0, 153, 255, 0.2)', color: '#7dd3fc' }}>
            {cmsPage?.sections?.hero?.tag || 'Turnkey Classroom STEM'}
          </span>
          <h1 style={{ color: 'var(--oxy-white)', marginBottom: '1.25rem' }}>
            {cmsPage?.sections?.hero?.title || 'Empower Teachers. Inspire Every Student.'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', lineHeight: 1.6 }}>
            {cmsPage?.sections?.hero?.subtitle || 'Oxybott Education Solutions combine hands-on modular hardware, anti-reverse safe wiring, teacher-ready slides, and standards-aligned STEM curricula for Grades 3 through 12.'}
          </p>
          {cmsPage?.sections?.hero?.description && (
            <p style={{ color: '#cbd5e1', fontSize: '1rem', marginTop: '0.75rem', lineHeight: 1.6 }}>
              {cmsPage.sections.hero.description}
            </p>
          )}
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {(() => {
              const pBtn = cmsPage?.sections?.hero?.content?.primaryBtn;
              const pText = pBtn?.text || 'Request Free Teacher Sample Kit →';
              const pUrl = pBtn?.url;

              if (pUrl && !pUrl.startsWith('#') && pBtn?.action !== 'open_quote_modal') {
                return pUrl.startsWith('http') ? (
                  <a href={pUrl} target="_blank" rel="noopener noreferrer" className="btn btn-orange btn-lg">{pText}</a>
                ) : (
                  <Link to={pUrl} className="btn btn-orange btn-lg">{pText}</Link>
                );
              }
              return (
                <button
                  type="button"
                  className="btn btn-orange btn-lg quote-modal-trigger"
                  onClick={onOpenQuote}
                >
                  {pText}
                </button>
              );
            })()}
            {(() => {
              const sBtn = cmsPage?.sections?.hero?.content?.secondaryBtn;
              const sText = sBtn?.text || 'Explore Education Series';
              const sUrl = sBtn?.url || '#showcase';

              return sUrl.startsWith('http') ? (
                <a href={sUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-white btn-lg">{sText}</a>
              ) : sUrl.startsWith('#') ? (
                <a href={sUrl} className="btn btn-outline-white btn-lg">{sText}</a>
              ) : (
                <Link to={sUrl} className="btn btn-outline-white btn-lg">{sText}</Link>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Highlight Pillars Grid */}
      <div className="container">
        <div className="edu-cards-grid">
          <div className="edu-highlight-card">
            <div className="edu-icon-badge" style={{ background: 'var(--oxy-primary-light)', color: 'var(--oxy-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M9 9h6v6H9z" />
                <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
              </svg>
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Magnetic Classroom System</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--oxy-gray-600)', lineHeight: 1.6 }}>
              Demonstrate circuits directly on your classroom whiteboard with our patented magnetic module holders and large-print schematics.
            </p>
          </div>

          <div className="edu-highlight-card">
            <div className="edu-icon-badge" style={{ background: 'var(--oxy-orange-light)', color: 'var(--oxy-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10M6 10h10" />
              </svg>
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Ready-to-Teach Lesson Plans</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--oxy-gray-600)', lineHeight: 1.6 }}>
              Save hundreds of planning hours. Each kit comes with editable PowerPoint lesson slides, student experiment worksheets, and grading rubrics.
            </p>
          </div>

          <div className="edu-highlight-card">
            <div className="edu-icon-badge" style={{ background: '#ecfdf5', color: 'var(--oxy-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Anti-Reverse Easy-Plug</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--oxy-gray-600)', lineHeight: 1.6 }}>
              Color-coded 4-pin RJ11 snap connectors prevent incorrect wiring, short-circuits, and student frustration during fast-paced 45-minute periods.
            </p>
          </div>
        </div>
      </div>

      {/* Grade-Wise Robotics Progression Section (Managed via CMS) */}
      {stagesSec && (
        <section className="container" id="progression" style={{ paddingTop: '4rem', paddingBottom: '1rem' }}>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="section-tag">{stagesSec.tag || 'Learning Pathways'}</span>
            <h2 className="section-title" style={{ fontSize: '2rem', marginTop: '0.5rem' }}>
              {stagesSec.title || 'Grade-Wise Robotics Progression'}
            </h2>
            <p className="section-subtitle" style={{ maxWidth: '700px', margin: '0.75rem auto 0', color: 'var(--oxy-gray-600)' }}>
              {stagesSec.subtitle || 'Designed to build cognitive thinking, computational logic, and mechanical intuition year over year.'}
            </p>
            {stagesSec.description && (
              <p style={{ color: 'var(--oxy-gray-500)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                {stagesSec.description}
              </p>
            )}
          </div>

          {stagesSec.content?.stages && Array.isArray(stagesSec.content.stages) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
              {stagesSec.content.stages.map((st, idx) => (
                <div key={idx} style={{ background: '#fff', border: '1px solid var(--oxy-gray-200)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
                  <span className="badge badge-blue" style={{ fontSize: '0.75rem', marginBottom: '0.75rem', display: 'inline-block' }}>
                    {st.level}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--oxy-navy)', marginBottom: '0.5rem' }}>{st.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--oxy-gray-600)', lineHeight: 1.6, margin: 0 }}>{st.desc}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Classroom Showcase Section */}
      <section className="container" id="showcase" style={{ paddingTop: '4rem', paddingBottom: '5rem' }}>
        {/* Showcase 1: Smart Home Classroom Display */}
        <div className="classroom-showcase-row">
          <div>
            <span className="section-tag">Year 1 &bull; Level 1</span>
            <h2 style={{ marginBottom: '1rem' }}>Oxybott QE023 Smart Home Classroom Kit</h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--oxy-gray-600)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Designed specifically for classroom lab groups of 1-2 students. Contains a complete smart living ecosystem with RFID door locks, ambient air quality monitors, smart lights, and voice-assisted actuators.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', padding: 0, listStyle: 'none' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.95rem', color: 'var(--oxy-gray-700)' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--oxy-primary-light)', color: 'var(--oxy-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span>24 structured 45-minute lesson units with student journals</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.95rem', color: 'var(--oxy-gray-700)' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--oxy-primary-light)', color: 'var(--oxy-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span>Sturdy stackable educator storage container with custom tool foam</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.95rem', color: 'var(--oxy-gray-700)' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--oxy-primary-light)', color: 'var(--oxy-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span>Dual-mode ESP32 controller compatible with OxyCode &amp; Python</span>
              </li>
            </ul>
            <div className="standards-badge-list">
              <span className="standard-chip">CSTA 2-CS-02</span>
              <span className="standard-chip">NGSS MS-ETS1</span>
              <span className="standard-chip">Cambridge Primary ICT</span>
            </div>
            <div style={{ marginTop: '2rem' }}>
              <Link to="/products/qe023" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>View Kit Specifications</span>
                <IconArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div>
            <img
              src="/assets/images/qe023-smart-home-edu.png"
              alt="Smart Home Education Kit"
              style={{ width: '100%', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {/* Showcase 2: Intelligent Transportation */}
        <div className="classroom-showcase-row">
          <div>
            <span className="section-tag orange">Year 2 &bull; Level 2</span>
            <h2 style={{ marginBottom: '1rem' }}>Oxybott QE036 Intelligent Transportation Kit</h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--oxy-gray-600)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Take students into civil engineering and smart municipal infrastructure. Students program traffic signal sync algorithms, automatic barrier RFID tollgates, pedestrian zebra crossing radars, and automated parking stalls.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', padding: 0, listStyle: 'none' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.95rem', color: 'var(--oxy-gray-700)' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--oxy-orange-light)', color: 'var(--oxy-orange)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span>Real-world urban automation challenges &amp; algorithmic problem solving</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.95rem', color: 'var(--oxy-gray-700)' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--oxy-orange-light)', color: 'var(--oxy-orange)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span>Foldable city grid simulation map included in each package</span>
              </li>
            </ul>
            <div className="standards-badge-list">
              <span className="standard-chip">CSTA 2-DA-08</span>
              <span className="standard-chip">NGSS MS-PS4</span>
            </div>
            <div style={{ marginTop: '2rem' }}>
              <Link to="/products/qe036" className="btn btn-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>View Kit Specifications</span>
                <IconArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div>
            <img
              src="/assets/images/qe036-transportation-kit.jpg"
              alt="Transportation Kit"
              style={{ width: '100%', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {/* Showcase 3: Smart Factory */}
        <div className="classroom-showcase-row">
          <div>
            <span className="section-tag" style={{ background: '#f3e8ff', color: 'var(--oxy-purple)' }}>
              Year 3 &bull; Industry 4.0
            </span>
            <h2 style={{ marginBottom: '1rem' }}>Oxybott QE037 Smart Factory Simulation Kit</h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--oxy-gray-600)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Bring real industrial manufacturing into your secondary school laboratory. Equipped with a motorized conveyor belt, color-sensing pneumatic diverters, optical limit switches, and cloud MQTT telemetry dashboards.
            </p>
            <div className="standards-badge-list">
              <span className="standard-chip">CSTA 3A-AP-14</span>
              <span className="standard-chip">Mechatronics Vocational</span>
            </div>
            <div style={{ marginTop: '2rem' }}>
              <Link to="/products/qe037" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>View Kit Specifications</span>
                <IconArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div>
            <img
              src="/assets/images/qe037-smart-factory.jpg"
              alt="Smart Factory Kit"
              style={{ width: '100%', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Turnkey Lab Bundles Section (Managed via CMS) */}
      {labsSec && (
        <section className="container" id="bundles" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="section-tag orange">{labsSec.tag || 'Classroom Packs'}</span>
            <h2 className="section-title" style={{ fontSize: '2rem', marginTop: '0.5rem' }}>
              {labsSec.title || 'Turnkey Lab Bundles'}
            </h2>
            <p className="section-subtitle" style={{ maxWidth: '700px', margin: '0.75rem auto 0', color: 'var(--oxy-gray-600)' }}>
              {labsSec.subtitle || 'Everything needed to outfit a classroom of 20 to 50 students with zero hassle.'}
            </p>
            {labsSec.description && (
              <p style={{ color: 'var(--oxy-gray-500)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                {labsSec.description}
              </p>
            )}
          </div>

          {labsSec.content?.bundles && Array.isArray(labsSec.content.bundles) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {labsSec.content.bundles.map((bundle, idx) => (
                <div key={idx} style={{ background: '#fff', border: '2px solid ' + (idx === 1 ? 'var(--oxy-orange)' : 'var(--oxy-gray-200)'), borderRadius: 'var(--radius-xl)', padding: '2rem', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  {idx === 1 && (
                    <span style={{ position: 'absolute', top: '-12px', right: '20px', background: 'var(--oxy-orange)', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                      Most Popular
                    </span>
                  )}
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--oxy-navy)', marginBottom: '0.25rem' }}>{bundle.name}</h3>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--oxy-primary)', marginBottom: '1rem' }}>{bundle.students}</div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--oxy-gray-600)', lineHeight: 1.6, flex: 1, marginBottom: '1.5rem' }}>{bundle.desc}</p>
                  <button type="button" className={`btn ${idx === 1 ? 'btn-orange' : 'btn-outline'} btn-block`} onClick={onOpenQuote}>
                    Request Bundle Quote →
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* School Trial Application Form Section */}
      <section className="container container-narrow" id="trial" style={{ marginBottom: '6rem' }}>
        <div style={{ backgroundColor: 'var(--oxy-gray-50)', border: '2px solid var(--oxy-primary)', borderRadius: 'var(--radius-xl)', padding: '3.5rem 2.5rem', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="section-tag">Educator Program</span>
            <h2 style={{ marginTop: '0.5rem' }}>Apply for a Free School Trial Evaluation Kit</h2>
            <p style={{ color: 'var(--oxy-gray-600)', marginTop: '0.5rem' }}>
              Qualifying K-12 STEM teachers, curriculum directors, and school principals are eligible to receive a complimentary Oxybott trial kit and curriculum bundle for 30-day classroom review.
            </p>
          </div>

          <form id="educationTrialForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label htmlFor="trialEducatorName" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>
                  Educator Full Name *
                </label>
                <input
                  type="text"
                  id="trialEducatorName"
                  required
                  placeholder="e.g. Dr. Emily Watson"
                  style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-md)', marginTop: '0.35rem' }}
                  value={formData.educatorName}
                  onChange={e => setFormData({ ...formData, educatorName: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="trialEmail" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>
                  Institutional Email (.edu/.org preferred) *
                </label>
                <input
                  type="email"
                  id="trialEmail"
                  required
                  placeholder="emily@lincolnschool.edu"
                  style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-md)', marginTop: '0.35rem' }}
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label htmlFor="trialSchoolName" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>
                  School / District Name *
                </label>
                <input
                  type="text"
                  id="trialSchoolName"
                  required
                  placeholder="Lincoln Unified School District"
                  style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-md)', marginTop: '0.35rem' }}
                  value={formData.schoolName}
                  onChange={e => setFormData({ ...formData, schoolName: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="trialRole" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>
                  Your Role / Title
                </label>
                <input
                  type="text"
                  id="trialRole"
                  placeholder="STEM Coordinator / CS Teacher"
                  style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-md)', marginTop: '0.35rem' }}
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label htmlFor="trialGradeLevel" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>
                  Target Grade Level
                </label>
                <select
                  id="trialGradeLevel"
                  style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-md)', marginTop: '0.35rem' }}
                  value={formData.grade}
                  onChange={e => setFormData({ ...formData, grade: e.target.value })}
                >
                  <option>Elementary School (Grades 3 - 5)</option>
                  <option>Middle School (Grades 6 - 8)</option>
                  <option>High School (Grades 9 - 12)</option>
                  <option>Vocational / University / Maker Space</option>
                </select>
              </div>
              <div>
                <label htmlFor="trialKit" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>
                  Desired Evaluation Kit
                </label>
                <select
                  id="trialKit"
                  style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-md)', marginTop: '0.35rem' }}
                  value={formData.kit}
                  onChange={e => setFormData({ ...formData, kit: e.target.value })}
                >
                  <option>QE023 Smart Home Classroom Kit</option>
                  <option>QD022 4-DOF Robotic Arm Kit</option>
                  <option>QD001 Omni-Wheel Coding Car Kit</option>
                  <option>QE036 Intelligent Transportation Kit</option>
                  <option>QE037 Smart Factory Simulator</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="trialAddress" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>
                Shipping Address for School Kit Delivery *
              </label>
              <textarea
                id="trialAddress"
                rows={2}
                required
                placeholder="Street address, City, State/Province, Postal Code, Country"
                style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-md)', marginTop: '0.35rem' }}
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <button
              type="submit"
              id="trialSubmitBtn"
              className="btn btn-primary btn-lg"
              style={{ marginTop: '0.75rem' }}
              disabled={submitting}
            >
              {submitting ? 'Submitting Application...' : 'Submit Evaluation Application \u2192'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
