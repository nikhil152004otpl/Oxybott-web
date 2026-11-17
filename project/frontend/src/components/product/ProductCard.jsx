import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { IconHeart, IconStar, IconGraduationCap, IconExternalLink } from '../common/Icons';

const formatImgSrc = (url) => {
  if (!url) return '/assets/images/oxybott_logo.webp';
  if (typeof url !== 'string') return '/assets/images/oxybott_logo.webp';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return url;
  if (url.startsWith('/')) return url;
  return `/${url}`;
};

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { formatPrice } = useStore();
  const { showToast } = useToast();
  const [isWished, setIsWished] = useState(false);

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    setIsWished(!isWished);
    showToast(!isWished ? `Added ${product.shortName} to Wishlist` : `Removed ${product.shortName} from Wishlist`);
  };

  const badgeClass =
    product.badge === 'Bestseller' || product.badge === 'Educator Choice'
      ? 'orange'
      : product.badge === 'New'
      ? 'purple'
      : '';

  return (
    <div className="product-card" data-category={product.category} data-series={product.series}>
      <div className="product-media">
        {product.badge && (
          <span className={`product-badge ${badgeClass}`}>{product.badge}</span>
        )}
        <button
          type="button"
          className="product-wish-btn"
          aria-label="Add to Wishlist"
          onClick={handleWishlistToggle}
          style={{ color: isWished ? 'var(--oxy-orange)' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <IconHeart size={16} filled={isWished} />
        </button>
        <Link to={`/products/${product.id || product.slug}`}>
          <img
            src={formatImgSrc(product.image || product.main_image)}
            alt={product.shortName || product.name}
            className="product-img"
            loading="lazy"
            decoding="async"
            onError={(e) => { e.target.src = '/assets/images/oxybott_logo.webp'; }}
          />
        </Link>
      </div>

      <div className="product-card-body">
        <div className="product-meta-row">
          <span className="product-series-tag">{product.series}</span>
          <span className="product-rating" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <IconStar size={12} fill="currentColor" style={{ marginRight: 3, color: 'var(--oxy-yellow)' }} />
            <span>{product.rating || '5.0'} ({product.reviewsCount || 0})</span>
          </span>
        </div>

        <h3 className="product-title">
          <Link to={`/products/${product.id || product.slug}`}>{product.name}</Link>
        </h3>

        <div className="product-age-chip" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <IconGraduationCap size={13} style={{ marginRight: 4 }} />
          <span>{product.age || 'All Ages'} {product.grade ? `• ${product.grade}` : ''}</span>
        </div>

        <div className="product-price-row">
          <span className="product-price">{formatPrice(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="product-originalPrice">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        <div className="product-actions">
          {product.osemi_url ? (
            <a
              href={product.osemi_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-orange btn-sm buy-osemi-btn"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
              title="Buy on OSEMI in a new tab"
            >
              <span>Buy on OSEMI</span>
              <IconExternalLink size={12} />
            </a>
          ) : (
            <Link to={`/products/${product.id || product.slug}`} className="btn btn-primary btn-sm">
              View Kit
            </Link>
          )}
          <Link to={`/products/${product.id || product.slug}`} className="btn btn-outline btn-sm">
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}

