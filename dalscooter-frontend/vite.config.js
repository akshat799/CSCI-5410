// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    port: 5173,
  },
  define: { global: 'window' },
  resolve: { alias: { buffer: 'buffer/' } },
  optimizeDeps: {
    include: [
      'buffer',
      'aws-amplify',
      'amazon-cognito-identity-js',
      'aws-sdk'
    ]
  },
  ssr: { noExternal: ['aws-amplify'] }
});
