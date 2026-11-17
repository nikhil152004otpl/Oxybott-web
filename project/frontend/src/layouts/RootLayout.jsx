import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AnnouncementBar from '../components/common/AnnouncementBar';
import SiteHeader from '../components/common/SiteHeader';
import SiteFooter from '../components/common/SiteFooter';
import CartDrawer from '../components/cart/CartDrawer';
import SearchModal from '../components/search/SearchModal';
import QuoteModal from '../components/modals/QuoteModal';

export default function RootLayout() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <AnnouncementBar />
      <SiteHeader
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenQuote={() => setIsQuoteOpen(true)}
      />

      <Outlet context={{ onOpenQuote: () => setIsQuoteOpen(true) }} />

      <SiteFooter />

      <CartDrawer />
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
      />
    </>
  );
}
