// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
