/**
 * Root Application Component
 *
 * This component:
 * - Sets up routing with React Router
 * - Wraps pages with layouts
 * - Manages global state (if needed)
 * - Handles global effects (auth check, etc.)
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box, Container } from '@chakra-ui/react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ExamplesPage from './pages/ExamplesPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Container maxW="container.xl" py={4}>
          <Routes>
            {/* Define all routes here */}
            <Route path="/" element={<HomePage />} />
            <Route path="/examples" element={<ExamplesPage />} />

            {/* 404 catch-all route - must be last */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Container>
      </Layout>
    </BrowserRouter>
  );
}
