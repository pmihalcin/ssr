import { defineConfig } from "@playwright/test";

// Both apps run behind the compose stack, so each project only differs in its base URL.
export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { trace: "retain-on-failure" },
  projects: [
    { name: "csr", use: { baseURL: process.env.CSR_URL ?? "http://localhost:5200" } },
    { name: "ssr", use: { baseURL: process.env.SSR_URL ?? "http://localhost:3000" } },
  ],
});
