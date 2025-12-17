/**
 * Root Application Component
 *
 * This component:
 * - Sets up routing with React Router
 * - Kicks off auth hydration (refresh -> /me)
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container } from '@chakra-ui/react';

import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';

import HomePage from './pages/HomePage';
import ExamplesPage from './pages/ExamplesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import NotFoundPage from './pages/NotFoundPage';

import { useAuthStore } from './stores/authStore';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Layout>
        <Container maxW="container.xl" py={4}>
          <Routes>
            <Route path="/" element={<HomePage />} />

            {/* Public auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route
              path="/account"
              element={
                <RequireAuth>
                  <AccountPage />
                </RequireAuth>
              }
            />

            <Route
              path="/examples"
              element={
                <RequireAuth>
                  <ExamplesPage />
                </RequireAuth>
              }
            />

            {/* 404 catch-all route - must be last */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Container>
      </Layout>
    </BrowserRouter>
  );
}
