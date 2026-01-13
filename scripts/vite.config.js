import { defineConfig, loadEnv } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  // Load env file from parent directory
  const env = loadEnv(mode, resolve(__dirname, ".."), "");

  return {
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
        env.VITE_API_BASE_URL
      ),
    },
    build: {
      lib: {
        entry: resolve(__dirname, "game-scripting/main-game.ts"),
        formats: ["es"],
        fileName: () => "main-game.js",
      },
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
