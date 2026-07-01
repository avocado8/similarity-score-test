import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    proxy: {
      "/api/quickdraw": {
        target:
          "https://storage.googleapis.com/quickdraw_dataset/full/simplified",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/quickdraw/, ""),
      },
    },
  },
});
