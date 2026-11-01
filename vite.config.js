import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { "/api": "http://localhost:3000", "/files": "http://localhost:3000" },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("/node_modules/")) return;
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) {
            return "react-vendor";
          }
          if (/\/node_modules\/(react-router|react-router-dom|@remix-run)\//.test(id)) {
            return "router-vendor";
          }
          if (id.includes("/node_modules/lucide-react/")) return "icons";
        },
      },
    },
  },
});
