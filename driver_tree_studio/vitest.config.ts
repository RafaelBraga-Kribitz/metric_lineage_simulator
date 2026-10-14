import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/engine/**", "src/schema/**", "src/lib/**"],
      reporter: ["text-summary", "text"],
    },
  },
});
