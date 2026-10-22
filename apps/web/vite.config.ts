import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Retailer calls go to apps/api, which holds the Kroger and Walmart keys.
    proxy: { "/api": "http://localhost:8787" },
  },
});
