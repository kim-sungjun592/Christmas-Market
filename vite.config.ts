import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  build: isSsrBuild
    ? { outDir: 'dist/server' }
    : {
        outDir: 'dist/client',
        manifest: true,
        rollupOptions: { input: 'app/entry-client.tsx' },
      },
  ssr: { noExternal: ['@shopify/hydrogen'] },
}));
