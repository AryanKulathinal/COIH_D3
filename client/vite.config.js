import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

const dataDir = fileURLToPath(new URL("../data", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@data": dataDir },
  },
  server: {
    port: 5173,
    fs: { allow: [".."] },
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
