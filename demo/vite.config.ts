import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

const demoRoot = __dirname;
const repoRoot = path.resolve(demoRoot, "..");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve(demoRoot, "node_modules/react"),
      "react-dom": path.resolve(demoRoot, "node_modules/react-dom"),
      recharts: path.resolve(demoRoot, "node_modules/recharts"),
    },
  },
  server: {
    port: 5173,
    open: true,
    fs: {
      allow: [repoRoot],
    },
  },
});
