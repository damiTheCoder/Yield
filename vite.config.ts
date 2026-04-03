import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    historyApiFallback: true,
    allowedHosts: ["solaris-w0xw.onrender.com", ".onrender.com"],
  },
  preview: {
    host: "::",
    port: Number(process.env.PORT || 4173),
    allowedHosts: ["solaris-w0xw.onrender.com", ".onrender.com"],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
