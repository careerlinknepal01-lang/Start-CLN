import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * Vitest configuration file.
 * Defines the testing environment, plugins, and path resolution for the test runner.
 * 
 * @returns {object} The complete configuration object for Vitest.
 */
export default defineConfig({
  // SWC compiler is used to ensure maximum performance during test compilation
  plugins: [react()],
  test: {
    // jsdom is required because our React components rely on browser APIs like document and window
    environment: "jsdom",
    // Global injections prevent the need to manually import describe, it, expect in every test file
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    // Mirrors our tsconfig alias so imports like `@/components/...` resolve correctly in tests
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
