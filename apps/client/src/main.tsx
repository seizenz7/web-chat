/**
 * Frontend Entry Point (Vite)
 *
 * This file:
 * 1. Initializes React by mounting to the DOM
 * 2. Sets up global providers (Chakra, Router, Store)
 * 3. Imports CSS (Tailwind)
 * 4. Starts the application
 *
 * The HTML file that loads this is in public/index.html
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App';
import './styles/globals.css';

/**
 * Mount React application to the DOM
 *
 * The HTML file (index.html) contains:
 * <div id="root"></div>
 *
 * React will render the entire application tree into this div.
 */
const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
