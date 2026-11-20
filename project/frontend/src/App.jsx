import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { StoreProvider } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ConsentProvider } from './context/ConsentContext';
import { router } from './routes';

export default function App() {
  return (
    <ConsentProvider>
      <ToastProvider>
        <StoreProvider>
          <CartProvider>
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </CartProvider>
        </StoreProvider>
      </ToastProvider>
    </ConsentProvider>
  );
}

