import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],

    // Only use dev server config when NOT in production
    ...(isProd
      ? {}
      : {
          server: {
            host: '0.0.0.0',
            port: 5173,
            strictPort: true,
            allowedHosts: ['unicorn-pleased-merely.ngrok-free.app'],
          },
        }),

    ssr: {
      noExternal: ['posthog-js', 'posthog-js/react'],
    },
  };
});
