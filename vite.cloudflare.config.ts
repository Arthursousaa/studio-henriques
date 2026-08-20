import tailwindcss from "@tailwindcss/vite";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ["iOS >= 12", "Safari >= 12"],
      modernPolyfills: true,
    }),
    tailwindcss(),
  ],
  define: {
    "import.meta.env.VITE_AUTH_MODE": JSON.stringify("password"),
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "cloudflare", "public"),
    emptyOutDir: true,
  },
});
