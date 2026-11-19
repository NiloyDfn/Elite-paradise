import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Dev: Vite serves the React app on PORT (default 3000) with hot reload and
// proxies /trpc, /api and /app-storage to the Express API (API_PORT, default
// 3001). Production has no Vite: `npm run build` puts the app in dist/public and
// the single Express process (dist/index.js) serves it together with the API.
const WEB_PORT = Number(process.env.PORT ?? 3000);
const API_PORT = Number(process.env.API_PORT ?? 3001);
const apiProxy = { target: `http://localhost:${API_PORT}`, changeOrigin: true };

export default defineConfig({
  base: "/",
  // Tailwind v4 runs as a Vite plugin (no tailwind.config / postcss / autoprefixer);
  // it auto-detects content, theme tokens live in client/src/index.css (@theme).
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client/src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  server: {
    port: WEB_PORT,
    host: true,
    // Only the client folder and shared/ are served by the dev server.
    fs: {
      allow: [
        path.resolve(import.meta.dirname, "client"),
        path.resolve(import.meta.dirname, "shared"),
      ],
    },
    proxy: {
      "/trpc": apiProxy,
      "/app-storage": apiProxy,
      "/api": apiProxy,
    },
  },
  build: {
    // Client build lands in dist/public; the prod server serves it statically.
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Lists every file the build named by its content hash, so the prod server
    // (server/_core/serve.ts) caches those for good and nothing else: a file
    // from client/public keeps its name, even under assets/, and must be asked
    // for again after a republish.
    manifest: true,
  },
});
