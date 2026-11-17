import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { StoreAPI, CMSAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useStore } from '../context/StoreContext';
import { IconMail, IconMapPin, IconClock, IconArrowRight, IconChevronDown } from '../components/common/Icons';

export default function ContactPage() {
  const { showToast } = useToast();
  const { settings } = useStore();
  const storeName = settings?.store_name || 'Oxybott STEM Robotics';
  const defaultSupportEmail = settings?.support_email || 'support@oxybott.com';
  const defaultEducationEmail = settings?.contact_email || 'education@oxybott.com';
  const defaultPhone = settings?.phone || '+1 (800) 555-OXYBOTT';

  const [cmsPage, setCmsPage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'School & District Volume Quote',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      showToast('Please fill out all required fields.', true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await StoreAPI.submitInquiry({
        type: 'contact',
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim()
      });
      if (res.success) {
        showToast(res.message || 'Your message has been sent successfully!');
        setFormData({
          name: '',
          email: '',
          subject: 'School & District Volume Quote',
          message: ''
        });
      } else {
        showToast(res.error || 'Failed to send message. Please try again.', true);
      }
    } catch (err) {
      showToast(err.message || 'Failed to send message. Please try again.', true);
    } finally {
      setSubmitting(false);
    }
  };

  const defaultFaqs = [
    {
      q: 'What makes Oxybott kits different from generic Arduino starter kits?',
      a: 'Oxybott standardizes on the dual-core 240MHz ESP32 with built-in Wi-Fi and Bluetooth BLE. Furthermore, all our educational modules utilize anti-reverse 4-pin Easy-Plug connectors, meaning students cannot reverse polarity or short-circuit boards during classroom activities. We also provide our customized OxyCode block programming suite alongside Arduino C++ and MicroPython.'
    },
    {
      q: 'Can schools pay via Purchase Orders (PO) or Net-30 invoicing?',
      a: 'Yes! We accept formal institutional Purchase Orders (POs) from verified public and private school districts, universities, and non-profit STEM hubs. Submit your quote request above or email education@oxybott.com with your official PO.'
    },
    {
      q: 'Are the teacher slides and curriculum worksheets editable?',
      a: 'Yes. All lesson slides are delivered in fully editable PowerPoint (.pptx) formats, and worksheets are provided in both PDF and Word (.docx) formats so teachers can customize grading rubrics and homework questions for their specific classroom pacing.'
    },
    {
      q: 'What age group is best suited for the QD022 Robot Arm?',
      a: 'The QD022 Robot Arm is ideal for Grade 6 through Grade 12 (Ages 12+), as well as collegiate maker spaces. Younger students can control it via joystick or drag-and-drop OxyCode blocks, while advanced students program inverse kinematics and trigonometry in Arduino C++ or MicroPython.'
    },
    {
      q: 'What is your warranty and replacement parts policy?',
      a: 'All Oxybott kits include a 1-year manufacturer warranty. If a servo motor, sensor, or structural bracket is accidentally damaged during a student build, our educational support team ships free replacement parts directly to your school.'
    }
  ];

  const [faqList, setFaqList] = useState(defaultFaqs);

  const loadData = useCallback(async () => {
    try {
      const [faqsRes, pageRes] = await Promise.allSettled([
        CMSAPI.getFaqs(),
        CMSAPI.getPage('contact')
      ]);

      if (faqsRes.status === 'fulfilled' && faqsRes.value?.faqs?.length > 0) {
        setFaqList(faqsRes.value.faqs.map(f => ({ q: f.question, a: f.answer })));
      }
      if (pageRes.status === 'fulfilled' && pageRes.value?.page) {
        setCmsPage(pageRes.value.page);
      }
    } catch (e) {
      console.warn('Could not load dynamic FAQs / contact CMS, using fallbacks:', e);
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

  const cmsInfo = cmsPage?.sections?.info;
  const supportEmail = settings?.support_email || cmsInfo?.content?.supportEmail || defaultSupportEmail;
  const educationEmail = settings?.contact_email || cmsInfo?.content?.educationEmail || defaultEducationEmail;
  const phone = settings?.phone || cmsInfo?.content?.phone || defaultPhone;
  const address = settings?.address || cmsInfo?.content?.address || '100 Innovation Way, Tech Park, Suite 400';
  const hours = cmsInfo?.content?.hours || 'Monday – Friday: 8:00 AM – 6:00 PM EST';

  return (
    <>
      {/* Banner */}
      <section style={{ background: 'linear-gradient(135deg, #071526 0%, #0c2340 100%)', color: 'var(--oxy-white)', padding: '4.5rem 0', textAlign: 'center' }}>
        <div className="container container-narrow">
          <span className="section-tag" style={{ background: 'rgba(0, 153, 255, 0.2)', color: '#7dd3fc' }}>
            {cmsInfo?.tag || "We're Here to Help"}
          </span>
          <h1 style={{ color: 'var(--oxy-white)', marginBottom: '1rem' }}>
            {cmsInfo?.title || 'Contact Oxybott Team'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.15rem', lineHeight: 1.6 }}>
            {cmsInfo?.subtitle || 'Whether you need classroom quote estimates, technical assistance with a sensor, or distributor partnership details, we are here for you.'}
          </p>
          {cmsInfo?.description && (
            <p style={{ color: '#cbd5e1', fontSize: '1rem', marginTop: '0.75rem', lineHeight: 1.5 }}>
              {cmsInfo.description}
            </p>
          )}
        </div>
      </section>

      <main className="container">
        <div className="contact-layout">
          {/* Contact Form */}
          <div>
            <h2 style={{ marginBottom: '0.75rem' }}>Send a Message</h2>
            <p style={{ color: 'var(--oxy-gray-600)', marginBottom: '2rem' }}>
              Please fill out the form below and an Oxybott specialist will respond promptly.
            </p>

            <form id="contactPageForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label htmlFor="contactName" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    required
                    placeholder="John Doe"
                    style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-md)', marginTop: '0.35rem' }}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="contactEmail" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>
                    Your Email *
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    required
                    placeholder="john@example.com"
                    style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-md)', marginTop: '0.35rem' }}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contactInquirySubject" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>
                  Inquiry Subject
                </label>
                <select
                  id="contactInquirySubject"
                  aria-label="Inquiry Subject"
                  style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-md)', marginTop: '0.35rem' }}
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                >
                  <option>School &amp; District Volume Quote</option>
                  <option>Technical Support &amp; Code Help</option>
                  <option>Free Teacher Evaluation Sample</option>
                  <option>Distributor &amp; Retail Partnership</option>
                  <option>OEM &amp; Co-Branding Opportunity</option>
                </select>
              </div>

              <div>
                <label htmlFor="contactMessage" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>
                  Message *
                </label>
                <textarea
                  id="contactMessage"
                  rows={5}
                  required
                  placeholder="How can our educational team assist you?"
                  style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-md)', marginTop: '0.35rem' }}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button
                type="submit"
                id="contactSubmitBtn"
                className="btn btn-primary btn-lg"
                style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                disabled={submitting}
              >
                <span>{submitting ? 'Sending...' : 'Send Inquiry'}</span>
                {!submitting && <IconArrowRight size={16} />}
              </button>
            </form>
          </div>

          {/* Channels & Office Info */}
          <div className="contact-info-card">
            <h3 style={{ marginBottom: '2rem' }}>Contact Channels</h3>

            <div className="info-channel-item">
              <div className="info-channel-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconMail size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--oxy-navy)', fontSize: '1.05rem' }}>Email Support</div>
                <div style={{ color: 'var(--oxy-gray-600)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                  <a href={`mailto:${supportEmail}`} style={{ color: 'var(--oxy-primary)', textDecoration: 'none' }}>{supportEmail}</a> (Technical)
                </div>
                <div style={{ color: 'var(--oxy-gray-600)', fontSize: '0.9rem' }}>
                  <a href={`mailto:${educationEmail}`} style={{ color: 'var(--oxy-primary)', textDecoration: 'none' }}>{educationEmail}</a> (School Orders)
                </div>
              </div>
            </div>

            <div className="info-channel-item">
              <div className="info-channel-icon" style={{ background: 'var(--oxy-orange-light)', color: 'var(--oxy-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconMapPin size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--oxy-navy)', fontSize: '1.05rem' }}>Global Headquarters</div>
                <div style={{ color: 'var(--oxy-gray-600)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{storeName}</div>
                <div style={{ color: 'var(--oxy-gray-600)', fontSize: '0.9rem' }}>{address}</div>
                <div style={{ color: 'var(--oxy-gray-600)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Phone: {phone}</div>
              </div>
            </div>

            <div className="info-channel-item">
              <div className="info-channel-icon" style={{ background: '#ecfdf5', color: 'var(--oxy-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconClock size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--oxy-navy)', fontSize: '1.05rem' }}>Support Hours</div>
                <div style={{ color: 'var(--oxy-gray-600)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{hours}</div>
                <div style={{ color: 'var(--oxy-gray-600)', fontSize: '0.9rem' }}>Weekend Ticket Escalation available</div>
              </div>
            </div>

            <div style={{ background: 'var(--oxy-white)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--oxy-gray-200)', marginTop: '1.5rem' }}>
              <h4 style={{ color: 'var(--oxy-navy)', marginBottom: '0.35rem' }}>Looking for instant documentation?</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--oxy-gray-600)', marginBottom: '1rem' }}>
                Browse our online wiki, video assembly walkthroughs, and code repos.
              </p>
              <Link to="/tutorials" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>Visit Tutorial Hub</span>
                <IconArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div style={{ paddingTop: '3rem', paddingBottom: '6rem', maxWidth: '860px', margin: '0 auto' }} id="faq">
          <div className="section-header">
            <span className="section-tag orange">Frequently Asked Questions</span>
            <h2 className="section-title">Common Questions from Educators &amp; Parents</h2>
          </div>

          <div className="faq-accordion">
            {faqList.map((faq, idx) => (
              <div key={idx} className={`faq-item ${openFaq === idx ? 'active' : ''}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                >
                  <span>{faq.q}</span>
                  <IconChevronDown
                    size={18}
                    style={{
                      transform: openFaq === idx ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.25s ease',
                      flexShrink: 0,
                      color: openFaq === idx ? 'var(--oxy-primary)' : 'var(--oxy-gray-400)'
                    }}
                  />
                </button>
                <div className="faq-answer">
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
