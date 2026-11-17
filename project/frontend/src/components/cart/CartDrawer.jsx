import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { IconX, IconShoppingCart, IconArrowRight } from '../common/Icons';

export default function CartDrawer() {
  const { items, isCartOpen, closeCart, updateQty, removeItem, subtotal } = useCart();
  const { formatPrice } = useStore();

  const handleCheckout = () => {
    if (items.length === 0) return;
    alert(`Purchases are fulfilled directly via OSEMI. Individual product links will redirect you to OSEMI's secure checkout. Total estimated: ${formatPrice(subtotal)}.`);
  };

  return (
    <div
      className={`cart-drawer-overlay ${isCartOpen ? 'open' : ''}`}
      id="cartDrawerOverlay"
      onClick={closeCart}
      style={{ display: isCartOpen ? 'block' : 'none' }}
    >
      <div
        className={`cart-drawer ${isCartOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart"
        onClick={e => e.stopPropagation()}
      >
        <div className="cart-header">
          <h3 className="cart-title">Your STEM Cart</h3>
          <button
            type="button"
            className="cart-close-btn"
            id="cartCloseBtn"
            aria-label="Close cart"
            onClick={closeCart}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="cart-body">
          {items.length === 0 ? (
            <div className="cart-empty-state" id="cartEmptyState" style={{ display: 'block' }}>
              <div className="cart-empty-icon" style={{ display: 'flex', justifyContent: 'center', color: '#94a3b8' }}>
                <IconShoppingCart size={40} />
              </div>
              <h4>Your cart is empty</h4>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Explore our hands-on STEM robotics kits to start building!
              </p>
              <Link
                to="/products"
                className="btn btn-primary btn-sm"
                style={{ marginTop: '1.5rem' }}
                onClick={closeCart}
              >
                Shop Kits
              </Link>
            </div>
          ) : (
            <div className="cart-items-list" id="cartDrawerItems">
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  <img
                    src={item.image}
                    alt={item.name || item.shortName}
                    className="cart-item-img"
                    onError={(e) => { e.target.src = '/assets/images/oxybott_logo.webp'; }}
                  />
                  <div className="cart-item-details">
                    <div className="cart-item-title">{item.name || item.shortName}</div>
                    <div className="cart-item-price">{formatPrice(item.price)}</div>
                    <div className="cart-qty-ctrl">
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => updateQty(item.id, -1)}
                      >
                        -
                      </button>
                      <span className="cart-qty-val">{item.qty}</span>
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => updateQty(item.id, 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="cart-remove-btn"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-summary-row">
            <span>Shipping:</span>
            <span style={{ color: 'var(--oxy-green)', fontWeight: 600 }}>FREE (Orders &gt;₹999)</span>
          </div>
          <div className="cart-summary-row cart-summary-total">
            <span>Subtotal:</span>
            <span id="cartDrawerSubtotal">{formatPrice(subtotal)}</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--oxy-gray-500)', margin: '0.4rem 0', textAlign: 'center' }}>
            Purchases &amp; deliveries are handled directly through OSEMI.
          </p>
          <button
            type="button"
            className="btn btn-orange checkout-btn"
            id="cartCheckoutBtn"
            onClick={handleCheckout}
            disabled={items.length === 0}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <span>Review &amp; Inquire</span>
            <IconArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
