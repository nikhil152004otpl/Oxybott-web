import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

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

import AdminLoginPage from '../pages/admin/AdminLoginPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
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

