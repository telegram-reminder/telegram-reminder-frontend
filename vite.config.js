import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // 🔥 FONDAMENTALE per Telegram WebView / TWA
  base: "./",

  build: {
    outDir: "dist",
    emptyOutDir: true,

    // opzionale ma consigliato
    assetsDir: "assets"
  }
});
