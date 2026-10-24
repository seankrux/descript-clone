import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function localApiPlugin() {
  return {
    name: 'local-api-handler',
    configureServer(server: any) {
      server.middlewares.use('/api', (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ok', local: true }));
      });
    },
    configurePreviewServer(server: any) {
      server.middlewares.use('/api', (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ok', local: true }));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localApiPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
