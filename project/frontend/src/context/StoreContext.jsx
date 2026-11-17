import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StoreAPI, CMSAPI } from '../services/api';
import { OXYBOTT_PRODUCTS } from '../utils/productsData';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [settings, setSettings] = useState({
    currency_code: 'INR',
    currency_symbol: '₹',
    store_name: 'Oxybott STEM Robotics',
    announcement: 'ESP32 EDUCATION SOLUTIONS INNOVATOR • Focus on Smart Robotics & Coding Kits!'
  });

  const [products, setProducts] = useState(OXYBOTT_PRODUCTS);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [navigation, setNavigation] = useState({
    header: [
      { id: '1', label: 'Products', url: '/products', badge: '' },
      { id: '2', label: 'Education Solutions', url: '/education', badge: 'Schools' },
      { id: '3', label: 'Software', url: '/software', badge: '' },
      { id: '4', label: 'Tutorials', url: '/tutorials', badge: 'Videos' },
      { id: '5', label: 'About Us', url: '/about', badge: '' },
      { id: '6', label: 'Contact', url: '/contact', badge: '' }
    ],
    footerQuick: [],
    footerProducts: [],
    footerSupport: []
  });
  const [loading, setLoading] = useState(true);

  // Price formatter adhering to INR formatting rules
  const formatPrice = useCallback((amount) => {
    const num = Number(amount) || 0;
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: (num % 1 === 0 ? 0 : 2)
      }).format(num);
    } catch (e) {
      const sym = settings?.currency_symbol || '₹';
      return `${sym}${num.toLocaleString('en-IN')}`;
    }
  }, [settings]);

  // Load store settings, categories, products, and navigation on mount
  const refreshStore = useCallback(async () => {
    try {
      const [settingsRes, catsRes, prodsRes, bannersRes, headerNavRes, fQuickRes, fProdRes, fSuppRes] = await Promise.allSettled([
        StoreAPI.getSettings(),
        StoreAPI.getCategories(),
        StoreAPI.getProducts(),
        StoreAPI.getBanners(),
        CMSAPI.getNavigation('header_main'),
        CMSAPI.getNavigation('footer_quick_links'),
        CMSAPI.getNavigation('footer_products'),
        CMSAPI.getNavigation('footer_support')
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value?.settings) {
        setSettings(settingsRes.value.settings);
        if (settingsRes.value.settings.seo_title) {
          document.title = settingsRes.value.settings.seo_title;
        }
      }

      if (catsRes.status === 'fulfilled' && catsRes.value?.categories) {
        setCategories(catsRes.value.categories);
      }

      if (prodsRes.status === 'fulfilled' && prodsRes.value?.products?.length > 0) {
        // Normalize products from backend API
        const normalized = prodsRes.value.products.map(p => {
          const rawImg = p.main_image || p.image || '/assets/images/oxybott_logo.webp';
          const normalizedImg = (rawImg.startsWith('http://') || rawImg.startsWith('https://') || rawImg.startsWith('//') || rawImg.startsWith('/')) ? rawImg : `/${rawImg}`;
          return {
            ...p,
            shortName: p.short_name || p.shortName || p.name,
            category: p.category || (p.series ? p.series.replace(' Series', '') : 'Robotics'),
            image: normalizedImg,
            price: Number(p.price) || 0,
            originalPrice: Number(p.sale_price || p.originalPrice || p.price) || 0,
            rating: Number(p.rating) || 5.0,
            reviewsCount: Number(p.reviews_count || p.reviewsCount) || 0
          };
        });
        setProducts(normalized);
      }

      if (bannersRes.status === 'fulfilled' && bannersRes.value?.banners) {
        setBanners(bannersRes.value.banners);
      }

      const newNav = { ...navigation };
      if (headerNavRes.status === 'fulfilled' && headerNavRes.value?.menu?.items?.length > 0) {
        newNav.header = headerNavRes.value.menu.items;
      }
      if (fQuickRes.status === 'fulfilled' && fQuickRes.value?.menu?.items?.length > 0) {
        newNav.footerQuick = fQuickRes.value.menu.items;
      }
      if (fProdRes.status === 'fulfilled' && fProdRes.value?.menu?.items?.length > 0) {
        newNav.footerProducts = fProdRes.value.menu.items;
      }
      if (fSuppRes.status === 'fulfilled' && fSuppRes.value?.menu?.items?.length > 0) {
        newNav.footerSupport = fSuppRes.value.menu.items;
      }
      setNavigation(newNav);
    } catch (err) {
      console.warn('StoreContext fetch error, using local dataset:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStore();
  }, [refreshStore]);

  // Synchronize settings instantly across components and browser tabs
  useEffect(() => {
    const handleSettingsUpdated = () => {
      refreshStore();
    };
    const handleStorage = (e) => {
      if (e.key === 'oxybott_settings_sync' || e.key === 'oxybott_cms_sync') {
        refreshStore();
      }
    };

    window.addEventListener('oxybott_settings_updated', handleSettingsUpdated);
    window.addEventListener('oxybott_cms_updated', handleSettingsUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('oxybott_settings_updated', handleSettingsUpdated);
      window.removeEventListener('oxybott_cms_updated', handleSettingsUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshStore]);

  const value = {
    settings,
    categories,
    products,
    banners,
    navigation,
    loading,
    formatPrice,
    refreshStore
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

