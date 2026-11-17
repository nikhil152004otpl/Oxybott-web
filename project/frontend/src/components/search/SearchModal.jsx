import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { IconX } from '../common/Icons';

export default function SearchModal({ isOpen, onClose }) {
  const { products, formatPrice } = useStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQ = query.trim().toLowerCase();
  const matches = cleanQ
    ? products.filter(p =>
        (p.name && p.name.toLowerCase().includes(cleanQ)) ||
        (p.id && p.id.toLowerCase().includes(cleanQ)) ||
        (p.sku && p.sku.toLowerCase().includes(cleanQ)) ||
        (p.series && p.series.toLowerCase().includes(cleanQ)) ||
        (p.category && p.category.toLowerCase().includes(cleanQ))
      )
    : [];

  const handleSelectProduct = (productId) => {
    onClose();
    navigate(`/products/${productId}`);
  };

  return (
    <div
      className="search-modal-overlay open"
      id="searchModalOverlay"
      onClick={onClose}
    >
      <div
        className="search-modal-box"
        onClick={e => e.stopPropagation()}
      >
        <div className="search-input-wrapper">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-input-field"
            id="searchModalInput"
            placeholder="Search by kit name, SKU (e.g. QD022, ESP32, Robot)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--oxy-gray-400)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem'
            }}
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="search-results-list" id="searchResultsList">
          {!cleanQ ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--oxy-gray-500)' }}>
              Type product name, SKU (e.g. <strong>QD022</strong>, <strong>ESP32</strong>, <strong>Robot</strong>), or series...
            </div>
          ) : matches.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--oxy-gray-500)' }}>
              No kits found matching &quot;{query}&quot;.
            </div>
          ) : (
            matches.map(p => (
              <div
                key={p.id}
                className="search-result-item"
                style={{ cursor: 'pointer' }}
                onClick={() => handleSelectProduct(p.id)}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '4px' }}
                  onError={(e) => { e.target.src = '/assets/images/oxybott_logo.webp'; }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--oxy-navy)', fontSize: '0.95rem' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--oxy-gray-500)' }}>
                    {p.series} &bull; {p.category}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--oxy-orange)' }}>
                  {formatPrice(p.price)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
