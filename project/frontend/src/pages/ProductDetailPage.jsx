import React, { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { StoreAPI } from '../services/api';
import {
  IconPackage,
  IconStar,
  IconGraduationCap,
  IconInfo,
  IconBookOpen,
  IconVideo,
  IconExternalLink,
  IconChevronRight,
  IconArrowRight
} from '../components/common/Icons';

const formatImgSrc = (url) => {
  if (!url) return '/assets/images/oxybott_logo.webp';
  if (typeof url !== 'string') return '/assets/images/oxybott_logo.webp';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return url;
  if (url.startsWith('/')) return url;
  return `/${url}`;
};

function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return `https://www.youtube-nocookie.com/embed/${match[2]}`;
  }
  return null;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { products, formatPrice } = useStore();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const { onOpenQuote } = useOutletContext() || {};

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('specs');

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await StoreAPI.getProduct(id);
        if (res.success && res.product) {
          setProduct(res.product);
          const firstImg = res.product.main_image || (res.product.images?.[0]?.image_url) || res.product.image;
          setSelectedImage(firstImg || '/assets/images/oxybott_logo.webp');
        } else {
          const local = products.find(p => p.id === id || p.slug === id);
          if (local) {
            setProduct(local);
            setSelectedImage(local.image || local.main_image || '/assets/images/oxybott_logo.webp');
          }
        }
      } catch {
        const local = products.find(p => p.id === id || p.slug === id);
        if (local) {
          setProduct(local);
          setSelectedImage(local.image || local.main_image || '/assets/images/oxybott_logo.webp');
        }
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
    window.scrollTo(0, 0);
  }, [id, products]);

  if (loading) {
    return (
      <main className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1.2rem', color: 'var(--oxy-gray-600)' }}>Loading STEM Kit details...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: '#94a3b8' }}>
          <IconPackage size={48} />
        </div>
        <h2 style={{ fontSize: '1.75rem', color: 'var(--oxy-navy)', marginBottom: '0.5rem' }}>Kit Not Found</h2>
        <p style={{ color: 'var(--oxy-gray-600)', marginBottom: '2rem' }}>The product you are looking for does not exist or has been removed.</p>
        <Link to="/products" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Browse Complete Catalog</span>
          <IconArrowRight size={16} />
        </Link>
      </main>
    );
  }

  const galleryImages = [
    product.main_image,
    product.image,
    ...(product.images ? product.images.map(img => typeof img === 'string' ? img : img.image_url) : [])
  ].filter(Boolean).map(formatImgSrc).filter((val, idx, arr) => arr.indexOf(val) === idx);

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleAddToCart = () => {
    addItem(product, qty);
    showToast(`Added ${qty} × ${product.name} to cart!`);
  };

  const defaultSpecs = {
    'Microcontroller': 'ESP32 Dual-Core Tensilica Xtensa 32-bit LX6 @ 240MHz',
    'Wireless Connectivity': 'Wi-Fi 802.11 b/g/n (2.4GHz) & Bluetooth v4.2 BR/EDR and BLE',
    'Actuators / Motors': product.category === 'Robotics' ? '4x High-Precision Metal-Gear Micro Servos' : 'PWM Servo & DC Geared Motors',
    'Sensors Included': product.specs?.sensors || 'Ultrasonic Distance, Photoresistor, Line Tracking, Temperature',
    'Display': '0.96-inch High-Contrast I2C 128x64 OLED Display',
    'Power Supply': 'Rechargeable 18650 Battery Holder / 5V USB-C Anti-Reverse Charging',
    'Programming Environments': 'OxyCode (Scratch 3.0), Arduino C++, MicroPython, Thonny IDE',
    'Curriculum Standards': 'CSTA K-12 Computer Science Standards, NGSS Engineering Design'
  };

  const specsData = product.specs && typeof product.specs === 'object' && !Array.isArray(product.specs)
    ? { ...defaultSpecs, ...product.specs }
    : defaultSpecs;

  const defaultBoxContents = [
    '1x Oxybott ESP32 Dual-Core Master Controller Board',
    '4x High-Torque Metal-Gear Micro Servos (SG90/MG90)',
    '1x Laser-Cut Structural Chassis Plates (Anti-Scratch Acrylic)',
    '1x 0.96-inch I2C Blue OLED Live Display Module',
    '1x Dual-Axis Analog Joystick Expansion Shield',
    '1x Anti-Reverse 4-Pin Easy-Plug Ribbon Cable Bundle',
    '1x Rechargeable Dual-18650 Battery Holder with Protection Circuit',
    '1x Full-Color Illustrated Step-by-Step Assembly Guidebook (64 Pages)'
  ];

  const boxContents = Array.isArray(product.boxContents) && product.boxContents.length > 0
    ? product.boxContents
    : defaultBoxContents;

  return (
    <main className="container" style={{ paddingTop: '1rem', paddingBottom: '6rem' }}>
      {/* Breadcrumb */}
      <div className="pdp-breadcrumb" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
        <Link to="/">Home</Link>
        <IconChevronRight size={12} style={{ color: '#94a3b8' }} />
        <Link to="/products">Products</Link>
        <IconChevronRight size={12} style={{ color: '#94a3b8' }} />
        <Link to={`/products?series=${encodeURIComponent(product.series || '')}`} id="pdpBreadcrumbSeries">
          {product.series || 'STEM Kits'}
        </Link>
        <IconChevronRight size={12} style={{ color: '#94a3b8' }} />
        <span id="pdpBreadcrumbTitle" style={{ color: 'var(--oxy-navy)', fontWeight: 600 }}>
          {product.name}
        </span>
      </div>

      {/* Main PDP View */}
      <div className="pdp-main-grid">
        {/* Media Gallery */}
        <div className="pdp-gallery-card">
          <img
            id="pdpMainImage"
            src={formatImgSrc(selectedImage || galleryImages[0] || product.main_image || product.image)}
            alt={product.name}
            className="pdp-main-img"
            onError={(e) => {
              if (!e.target.src.endsWith('/assets/images/oxybott_logo.webp')) {
                e.target.src = '/assets/images/oxybott_logo.webp';
              }
            }}
          />
          {galleryImages.length > 1 && (
            <div id="pdpThumbnails" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  style={{
                    border: selectedImage === img ? '2px solid var(--oxy-primary)' : '1px solid var(--oxy-gray-300)',
                    padding: '2px',
                    borderRadius: '4px',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <img src={formatImgSrc(img)} alt={`Thumb ${idx}`} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            {product.badge && <span className="product-badge" id="pdpBadgeTag">{product.badge}</span>}
            <span className="product-age-chip" id="pdpAgeTag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <IconGraduationCap size={14} />
              <span>{product.age || 'All Ages'}</span>
            </span>
          </div>
        </div>

        {/* Info Column */}
        <div className="pdp-info">
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--oxy-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }} id="pdpSeries">
            {product.series || 'Inventor Series'}
          </div>
          <h1 className="pdp-title" id="pdpTitle">{product.name}</h1>
          <div className="pdp-rating-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--oxy-yellow)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }} id="pdpRating">
              <IconStar size={14} fill="currentColor" />
              <span>{product.rating || '4.9'}</span>
            </span>
            <span style={{ color: 'var(--oxy-gray-500)' }} id="pdpReviewCount">({product.reviewsCount || 142} verified reviews)</span>
            <span style={{ color: 'var(--oxy-green)', fontWeight: 600 }}>&bull; In Stock &amp; Ready to Ship</span>
          </div>

          <div className="pdp-price-box">
            <div className="pdp-price" id="pdpPrice">{formatPrice(product.price)}</div>
            {product.originalPrice && product.originalPrice > product.price && (
              <div style={{ fontSize: '1.1rem', color: 'var(--oxy-gray-500)', textDecoration: 'line-through' }} id="pdpOriginalPrice">
                {formatPrice(product.originalPrice)}
              </div>
            )}
            {discountPercent && (
              <div style={{ background: 'var(--oxy-orange-light)', color: 'var(--oxy-orange)', fontSize: '0.8rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                Save {discountPercent}%
              </div>
            )}
          </div>

          <p style={{ fontSize: '1rem', color: 'var(--oxy-gray-600)', marginBottom: '1.5rem', lineHeight: 1.6 }} id="pdpDescription">
            {product.description || product.tagline || 'Engineered for hands-on STEM robotics education, maker classrooms, and students.'}
          </p>

          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--oxy-navy)' }}>Core STEM Highlights:</h4>
          <div className="pdp-highlights-list" id="pdpHighlights">
            {(product.highlights && product.highlights.length > 0 ? product.highlights : [
              'Dual-Core 240MHz ESP32 with built-in Wi-Fi & Bluetooth BLE',
              'Tri-lingual coding: OxyCode visual drag-and-drop, Arduino C++, & MicroPython',
              'Anti-reverse 4-pin cables eliminate short-circuits and burnt components'
            ]).map((h, idx) => (
              <div key={idx} className="pdp-highlight-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>{h}</span>
              </div>
            ))}
          </div>

          {/* Purchase on OSEMI / Institutional Quote Area */}
          <div className="pdp-order-box" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {product.osemi_url ? (
              <a
                href={product.osemi_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-orange btn-lg"
                id="pdpBuyOsemiBtn"
                style={{
                  flexGrow: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  fontSize: '1.05rem',
                  fontWeight: 700
                }}
              >
                <span>Buy on OSEMI</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                id="pdpBuyOsemiBtnDisabled"
                disabled
                style={{
                  flexGrow: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: 0.75,
                  cursor: 'not-allowed',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
                title="Purchasing link coming soon on OSEMI"
              >
                <span>Available on OSEMI Soon</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-outline btn-lg quote-modal-trigger"
              onClick={onOpenQuote}
              style={{ fontWeight: 600 }}
            >
              School Quote
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--oxy-gray-200)', paddingTop: '1.25rem', fontSize: '0.85rem', color: 'var(--oxy-gray-500)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div><strong>SKU:</strong> <span id="pdpSku">{product.sku || product.id}</span></div>
            <div><strong>Compatibility:</strong> OxyCode, Arduino IDE, MicroPython, Thonny</div>
            <div><strong>Free Shipping:</strong> On orders over ₹999 across India</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--oxy-gray-500)', fontStyle: 'italic', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconInfo size={14} style={{ flexShrink: 0 }} />
              <span>Direct purchases and fulfillment are handled securely through our official partner OSEMI.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Detailed Sections */}
      <div style={{ margin: '4rem 0 0 0' }}>
        <div className="pdp-tabs-nav">
          <button
            type="button"
            className={`pdp-tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            Specifications
          </button>
          <button
            type="button"
            className={`pdp-tab-btn ${activeTab === 'contents' ? 'active' : ''}`}
            onClick={() => setActiveTab('contents')}
          >
            What's in the Box
          </button>
          <button
            type="button"
            className={`pdp-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
            id="tabDocumentsBtn"
          >
            Documents &amp; Tutorials {product.documents?.length > 0 ? `(${product.documents.length})` : ''}
          </button>
          <button
            type="button"
            className={`pdp-tab-btn ${activeTab === 'curriculum' ? 'active' : ''}`}
            onClick={() => setActiveTab('curriculum')}
          >
            Curriculum Units
          </button>
          <button
            type="button"
            className={`pdp-tab-btn ${activeTab === 'software' ? 'active' : ''}`}
            onClick={() => setActiveTab('software')}
          >
            Software Downloads
          </button>
        </div>

        {/* Specs Pane */}
        <div className={`pdp-tab-pane ${activeTab === 'specs' ? 'active' : ''}`} id="tabSpecs">
          <h3 style={{ marginBottom: '1rem' }}>Hardware &amp; Electrical Specifications</h3>
          <table className="spec-table" id="pdpSpecsTable">
            <tbody>
              {Object.entries(specsData).map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Box Contents Pane */}
        <div className={`pdp-tab-pane ${activeTab === 'contents' ? 'active' : ''}`} id="tabContents">
          <h3 style={{ marginBottom: '1rem' }}>Complete Packaging &amp; Component List</h3>
          <p style={{ color: 'var(--oxy-gray-600)', marginBottom: '1.5rem' }}>
            Every component is individually labeled and packaged in high-grade anti-static compartments.
          </p>
          <ul id="pdpBoxList" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', paddingLeft: '1.25rem' }}>
            {boxContents.map((item, idx) => (
              <li key={idx} style={{ color: 'var(--oxy-gray-700)', fontSize: '0.95rem' }}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Documents & Tutorials Pane */}
        <div className={`pdp-tab-pane ${activeTab === 'documents' ? 'active' : ''}`} id="tabDocuments">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Documents &amp; Tutorials</h3>
              <p style={{ color: 'var(--oxy-gray-600)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                Video walkthroughs, official assembly manuals, and programming tutorials.
              </p>
            </div>
            <span style={{ fontSize: '0.85rem', background: 'var(--oxy-gray-100)', color: 'var(--oxy-gray-700)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
              {product.documents?.length || 0} Available
            </span>
          </div>

          {(!product.documents || product.documents.length === 0) ? (
            <div style={{
              background: 'var(--oxy-gray-50)',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 1.5rem',
              textAlign: 'center',
              border: '1px dashed var(--oxy-gray-300)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: '#94a3b8' }}>
                <IconBookOpen size={36} />
              </div>
              <h4 style={{ color: 'var(--oxy-navy)', marginBottom: '0.5rem' }}>No Documents or Videos Uploaded Yet</h4>
              <p style={{ color: 'var(--oxy-gray-600)', maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
                Tutorial videos and assembly guides for this kit are currently being prepared. You can explore online tutorials or reach out for assistance.
              </p>
              <Link to="/tutorials" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>Browse Online Tutorials</span>
                <IconArrowRight size={14} />
              </Link>
            </div>
          ) : (() => {
            const allDocs = product.documents;
            const videoDocs = allDocs.filter(d => Boolean(d.video_url) || (d.mime_type && d.mime_type.startsWith('video/')) || (d.file_path && /\.(mp4|webm|mov|mkv)$/i.test(d.file_path)));
            const pdfDocs = allDocs.filter(d => !videoDocs.some(vd => vd.id === d.id));

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Video Tutorials Section */}
                {videoDocs.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <IconVideo size={20} style={{ color: 'var(--oxy-primary)' }} />
                      <h4 style={{ margin: 0, color: 'var(--oxy-navy)' }}>Video Tutorials &amp; Assembly Walkthroughs</h4>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: '1.25rem'
                    }}>
                      {videoDocs.map(doc => {
                        const ytEmbed = getYouTubeEmbedUrl(doc.video_url);
                        const isUploadedVideo = Boolean(doc.file_path && !doc.video_url && ((doc.mime_type && doc.mime_type.startsWith('video/')) || /\.(mp4|webm|mov|mkv)$/i.test(doc.file_path)));
                        const uploadDate = doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

                        return (
                          <div
                            key={doc.id}
                            style={{
                              background: '#fff',
                              border: '1px solid var(--oxy-gray-200)',
                              borderRadius: 'var(--radius-md)',
                              overflow: 'hidden',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            {/* Video Player Display */}
                            {ytEmbed ? (
                              <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000' }}>
                                <iframe
                                  src={ytEmbed}
                                  title={doc.document_title}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                />
                              </div>
                            ) : isUploadedVideo ? (
                              <div style={{ background: '#0f172a' }}>
                                <video
                                  controls
                                  preload="metadata"
                                  style={{ width: '100%', display: 'block', maxHeight: '280px' }}
                                  src={doc.file_path}
                                >
                                  Your browser does not support HTML5 video playback.
                                </video>
                              </div>
                            ) : doc.video_url ? (
                              <div style={{ padding: '2rem 1rem', background: '#f8fafc', textAlign: 'center', borderBottom: '1px solid var(--oxy-gray-200)' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: '#64748b' }}>
                                  <IconExternalLink size={24} />
                                </div>
                                <a href={doc.video_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span>Watch Video Tutorial</span>
                                  <IconExternalLink size={13} />
                                </a>
                              </div>
                            ) : null}

                            {/* Video Info & Meta */}
                            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem' }}>
                                  <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    background: ytEmbed ? '#fee2e2' : '#e0e7ff',
                                    color: ytEmbed ? '#991b1b' : '#3730a3'
                                  }}>
                                    {ytEmbed ? 'YouTube Tutorial' : isUploadedVideo ? 'Video File' : 'Video Guide'}
                                  </span>
                                  {uploadDate && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--oxy-gray-500)' }}>
                                      {uploadDate}
                                    </span>
                                  )}
                                </div>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: 'var(--oxy-navy)', lineHeight: 1.4 }}>
                                  {doc.document_title}
                                </h4>
                              </div>

                              <div style={{ paddingTop: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--oxy-gray-100)', display: 'flex', gap: '0.5rem' }}>
                                {doc.video_url ? (
                                  <a
                                    href={doc.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline btn-sm"
                                    style={{ flex: 1, textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', textDecoration: 'none' }}
                                  >
                                    <IconExternalLink size={14} />
                                    <span>Watch on {ytEmbed ? 'YouTube' : 'Web'}</span>
                                  </a>
                                ) : isUploadedVideo ? (
                                  <a
                                    href={`/api/documents/${doc.id}/download`}
                                    download={doc.original_filename || 'tutorial_video.mp4'}
                                    className="btn btn-primary btn-sm"
                                    style={{ flex: 1, textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', textDecoration: 'none' }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    <span>Download Video ({((doc.file_size || 0) / (1024 * 1024)).toFixed(1)} MB)</span>
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PDF Documents Section */}
                {pdfDocs.length > 0 && (
                  <div>
                    {videoDocs.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingTop: '0.5rem' }}>
                        <IconFileText size={20} style={{ color: 'var(--oxy-primary)' }} />
                        <h4 style={{ margin: 0, color: 'var(--oxy-navy)' }}>Official PDF Manuals &amp; Assembly Guides</h4>
                      </div>
                    )}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: '1.25rem'
                    }}>
                      {pdfDocs.map((doc) => {
                        const isAssembly = doc.document_type === 'assembly_guide';
                        const badgeText = isAssembly ? 'Assembly Guide' : doc.document_type === 'curriculum' ? 'Curriculum' : 'Tutorial';
                        const sizeMb = ((doc.file_size || 0) / (1024 * 1024)).toFixed(2);
                        const uploadDate = doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

                        return (
                          <div
                            key={doc.id}
                            style={{
                              background: '#fff',
                              border: '1px solid var(--oxy-gray-200)',
                              borderRadius: 'var(--radius-md)',
                              padding: '1.25rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  background: isAssembly ? '#dbeafe' : '#fef3c7',
                                  color: isAssembly ? '#1e40af' : '#92400e'
                                }}>
                                  {badgeText}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--oxy-gray-500)' }}>
                                  PDF &bull; {sizeMb} MB
                                </span>
                              </div>
                              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: 'var(--oxy-navy)', lineHeight: 1.4 }}>
                                {doc.document_title}
                              </h4>
                              {uploadDate && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--oxy-gray-500)', margin: '0 0 1rem 0' }}>
                                  Uploaded: {uploadDate}
                                </p>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--oxy-gray-100)' }}>
                              <a
                                href={doc.file_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline btn-sm"
                                style={{ flex: 1, textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', textDecoration: 'none' }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                <span>View PDF</span>
                              </a>
                              <a
                                href={`/api/documents/${doc.id}/download`}
                                download={doc.original_filename}
                                className="btn btn-primary btn-sm"
                                style={{ flex: 1, textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', textDecoration: 'none' }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                <span>Download PDF</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Curriculum Pane */}
        <div className={`pdp-tab-pane ${activeTab === 'curriculum' ? 'active' : ''}`} id="tabCurriculum">
          <h3 style={{ marginBottom: '1rem' }}>Structured STEM Curriculum Units</h3>
          <p style={{ color: 'var(--oxy-gray-600)', marginBottom: '1.5rem' }}>
            Designed for 1-2 students per kit over a 6 to 12-week course.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--oxy-gray-50)', padding: '1.25rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--oxy-primary)' }}>
              <h4 style={{ color: 'var(--oxy-navy)', margin: 0 }}>Unit 1: Assembly &amp; Servo Calibration</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--oxy-gray-600)', marginTop: '0.25rem', marginBottom: 0 }}>
                Learn 4-axis structural dynamics, mechanical gear leverage, and zero-degree servo calibration.
              </p>
            </div>
            <div style={{ background: 'var(--oxy-gray-50)', padding: '1.25rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--oxy-orange)' }}>
              <h4 style={{ color: 'var(--oxy-navy)', margin: 0 }}>Unit 2: OxyCode Visual Block Programming</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--oxy-gray-600)', marginTop: '0.25rem', marginBottom: 0 }}>
                Map dual-axis joysticks to PWM angles, display coordinates on OLED, and code autonomous pick-and-place loops.
              </p>
            </div>
            <div style={{ background: 'var(--oxy-gray-50)', padding: '1.25rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--oxy-purple)' }}>
              <h4 style={{ color: 'var(--oxy-navy)', margin: 0 }}>Unit 3: Arduino C++ &amp; Inverse Kinematics</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--oxy-gray-600)', marginTop: '0.25rem', marginBottom: 0 }}>
                Transition into syntax coding. Compute trigonometric angles from X-Y-Z target coordinates in 3D workspace.
              </p>
            </div>
          </div>
        </div>

        {/* Software Downloads Pane */}
        <div className={`pdp-tab-pane ${activeTab === 'software' ? 'active' : ''}`} id="tabSoftware">
          <h3 style={{ marginBottom: '1rem' }}>Official Software &amp; Drivers</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div style={{ background: 'var(--oxy-gray-50)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>OxyCode 2.2.1 IDE</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--oxy-gray-500)', margin: '0.5rem 0 1rem' }}>Windows, Mac &amp; Web Editor</p>
              <Link to="/software" className="btn btn-primary btn-sm">Download (.exe)</Link>
            </div>
            <div style={{ background: 'var(--oxy-gray-50)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Arduino Library &amp; Code</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--oxy-gray-500)', margin: '0.5rem 0 1rem' }}>Includes 20+ Example Sketches</p>
              <Link to="/tutorials" className="btn btn-outline btn-sm">Download ZIP</Link>
            </div>
            <div style={{ background: 'var(--oxy-gray-50)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Oxybott Mobile Controller</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--oxy-gray-500)', margin: '0.5rem 0 1rem' }}>iOS &amp; Android BLE App</p>
              <Link to="/software" className="btn btn-orange btn-sm">Get App</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
