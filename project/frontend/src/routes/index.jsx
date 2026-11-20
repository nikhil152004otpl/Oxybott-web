import React, { useEffect } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';

import RootLayout from '../layouts/RootLayout';
import ErrorBoundary from '../components/common/ErrorBoundary';
import HomePage from '../pages/HomePage';
import ProductsPage from '../pages/ProductsPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import EducationPage from '../pages/EducationPage';
import SoftwarePage from '../pages/SoftwarePage';
import TutorialsPage from '../pages/TutorialsPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';
import NotFoundPage from '../pages/NotFoundPage';
import CookiePolicyPage from '../pages/CookiePolicyPage';

import AdminLoginPage from '../pages/admin/AdminLoginPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';

import { trackPageView } from '../utils/analytics';
import CookieConsent from '../components/common/CookieConsent';

// Wraps RootLayout to inject analytics tracking + cookie consent banner
function TrackedRootLayout() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  return (
    <>
      <CookieConsent />
      <RootLayout />
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <TrackedRootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'education', element: <EducationPage /> },
      { path: 'software', element: <SoftwarePage /> },
      { path: 'tutorials', element: <TutorialsPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'cookies', element: <CookiePolicyPage /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />
  },
  {
    path: '/admin',
    element: <AdminDashboardPage />
  }
]);

