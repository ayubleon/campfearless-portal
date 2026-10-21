import path from "node:path"
import { defineConfig } from "vitest/config"

// Tests live in /tests and check the rules (validation, duplicates, counts, fees, permissions). They bring their own small made-up
// data, so they keep working when the sample data is replaced by the real backend. `tests/sample-data.test.ts` is the one
// exception: it checks the sample data itself and can be deleted once the data comes from the server.
export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, ".") } },
})
