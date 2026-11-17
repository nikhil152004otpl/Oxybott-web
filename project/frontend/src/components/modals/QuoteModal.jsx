import React, { useState } from 'react';
import { StoreAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { IconX, IconArrowRight } from '../common/Icons';

export default function QuoteModal({ isOpen, onClose }) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    school: '',
    studentCount: '10 - 30 Students',
    productInterest: 'Oxybott QD022 4-DOF Programmable Robot Arm Kit',
    comments: ''
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await StoreAPI.submitInquiry({
        type: 'quote',
        name: formData.name,
        email: formData.email,
        organization: formData.school,
        subject: `School Quote: ${formData.productInterest}`,
        message: `Students: ${formData.studentCount}. Product: ${formData.productInterest}. Details: ${formData.comments || 'None'}`
      });
      showToast('Thank you! Your educational request has been received.');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to submit quote request. Please try again.', true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="search-modal-overlay open"
      id="quoteModalOverlay"
      onClick={onClose}
    >
      <div
        className="search-modal-box"
        style={{ maxWidth: '580px', padding: '2rem' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--oxy-navy)', margin: 0 }}>Request School Quote / Free Sample</h3>
          <button
            type="button"
            id="quoteModalClose"
            onClick={onClose}
            aria-label="Close quote modal"
            style={{
              color: 'var(--oxy-gray-500)',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconX size={20} />
          </button>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--oxy-gray-600)', marginBottom: '1.5rem' }}>
          Are you an educator, district coordinator, or school administrator? Fill out this inquiry to receive volume tier pricing or a free evaluation sample kit.
        </p>

        <form id="quoteRequestForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>Full Name *</label>
              <input
                type="text"
                required
                style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem' }}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>Work Email *</label>
              <input
                type="email"
                required
                style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem' }}
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>School / Organization *</label>
              <input
                type="text"
                required
                style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem' }}
                value={formData.school}
                onChange={e => setFormData({ ...formData, school: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>Estimated Student Count</label>
              <select
                style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem' }}
                value={formData.studentCount}
                onChange={e => setFormData({ ...formData, studentCount: e.target.value })}
              >
                <option>10 - 30 Students</option>
                <option>30 - 100 Students</option>
                <option>100 - 500 Students</option>
                <option>District-Wide (500+)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>Product(s) of Interest</label>
            <select
              style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem' }}
              value={formData.productInterest}
              onChange={e => setFormData({ ...formData, productInterest: e.target.value })}
            >
              <option>Oxybott QD022 4-DOF Programmable Robot Arm Kit</option>
              <option>Oxybott QE023 Smart Home Classroom Education Kit</option>
              <option>Oxybott QD001 Omni-Wheel Smart Robot Car Kit</option>
              <option>Oxybott QE036 Intelligent Transportation Kit</option>
              <option>Oxybott QE037 Smart Factory Industry 4.0 Kit</option>
              <option>Custom Mix for Maker Space</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--oxy-navy)' }}>Special Requirements / Comments</label>
            <textarea
              rows={3}
              style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--oxy-gray-300)', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem' }}
              placeholder="Tell us about your course timeline, target grades, or curriculum standards..."
              value={formData.comments}
              onChange={e => setFormData({ ...formData, comments: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="btn btn-orange"
            style={{ width: '100%', marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            disabled={submitting}
          >
            <span>{submitting ? 'Submitting...' : 'Submit Educational Request'}</span>
            {!submitting && <IconArrowRight size={15} />}
          </button>
        </form>
      </div>
    </div>
  );
}
