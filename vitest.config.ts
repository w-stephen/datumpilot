import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    include: ["apps/web/tests/**/*.test.ts"],
    globals: false
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./apps/web"),
      "@/lib": resolve(__dirname, "./apps/web/lib"),
      "@/components": resolve(__dirname, "./apps/web/components"),
      "@/app": resolve(__dirname, "./apps/web/app")
    }
  }
});
