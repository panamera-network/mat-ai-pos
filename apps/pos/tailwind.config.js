/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@mat-ai/tailwind-config')],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
};