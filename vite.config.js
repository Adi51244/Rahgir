import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import fs from 'fs';
import path from 'path';

function serveDir(route, dir) {
  return {
    name: `serve-${route}`,
    configureServer(server) {
      server.middlewares.use(route, (req, res, next) => {
        const rel = decodeURIComponent(req.url.split('?')[0]);
        const filePath = path.join(dir, rel);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const types = {
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.jpg': 'image/jpeg',
            '.mp3': 'audio/mpeg',
            '.json': 'application/json',
          };
          res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [
    serveDir('/Asset', resolve(__dirname, 'Asset')),
    serveDir('/data', resolve(__dirname, 'data')),
    viteStaticCopy({
      targets: [
        { src: 'Asset/**/*', dest: 'Asset' },
        { src: 'data/*.json', dest: 'data' },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    fs: { allow: ['.'] },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        songs: resolve(__dirname, 'songs.html'),
        playlists: resolve(__dirname, 'playlists.html'),
      },
    },
  },
});
