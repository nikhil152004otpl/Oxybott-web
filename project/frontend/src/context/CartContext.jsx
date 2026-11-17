import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { showToast } = useToast();
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('oxybott_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('oxybott_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const addItem = useCallback((product, qty = 1) => {
    if (!product) return;
    const productId = product.id || product.slug;

    setItems(prevItems => {
      const existing = prevItems.find(item => item.id === productId);
      if (existing) {
        return prevItems.map(item =>
          item.id === productId
            ? { ...item, qty: item.qty + qty, price: Number(product.price) || item.price }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            id: productId,
            name: product.name,
            shortName: product.shortName || product.name,
            price: Number(product.price) || 0,
            image: product.image || product.main_image || '/assets/images/oxybott_logo.webp',
            qty
          }
        ];
      }
    });

    showToast(`Added "${product.shortName || product.name}" to your cart!`);
    openCart();
  }, [showToast, openCart]);

  const removeItem = useCallback((productId) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateQty = useCallback((productId, delta) => {
    setItems(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const count = items.reduce((acc, i) => acc + i.qty, 0);
  const subtotal = items.reduce((acc, i) => acc + (i.price * i.qty), 0);

  return (
    <CartContext.Provider value={{
      items,
      count,
      subtotal,
      isCartOpen,
      openCart,
      closeCart,
      addItem,
      removeItem,
      updateQty,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

