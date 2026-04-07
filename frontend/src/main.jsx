import React from 'react';
import { createRoot } from 'react-dom/client';
import HomePage from './pages/HomePage';
import { AuthProvider } from './context/AuthContext';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  </React.StrictMode>
);
