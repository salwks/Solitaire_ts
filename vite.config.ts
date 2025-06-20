import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "./",
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/core": resolve(__dirname, "./src/core"),
      "@/entities": resolve(__dirname, "./src/entities"),
      "@/game": resolve(__dirname, "./src/game"),
      "@/ui": resolve(__dirname, "./src/ui"),
      "@/utils": resolve(__dirname, "./src/utils"),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    },
    target: "es2020",
  },
  esbuild: {
    target: "es2020",
  },
});