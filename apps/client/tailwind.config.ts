/**
 * Tailwind CSS Configuration
 *
 * Tailwind is a utility-first CSS framework that makes it easy
 * to build responsive, modern UIs without writing custom CSS.
 *
 * Instead of:
 *   .button { padding: 10px 20px; background: blue; }
 *
 * You use:
 *   <button class="px-5 py-2 bg-blue-500">Click me</button>
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Add custom colors here if needed
      },
    },
  },
  plugins: [],
};

export default config;
