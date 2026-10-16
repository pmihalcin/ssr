import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

// Captures the Dashboard with the timing overlay for both apps at 0 ms and 1500 ms of Simulated Latency.
// Run it against production builds (the compose stack): pnpm --filter @ssr/e2e screenshots
const apps = {
  csr: process.env.CSR_URL ?? "http://localhost:5200",
  ssr: process.env.SSR_URL ?? "http://localhost:3000",
};
const latencies = [0, 1500];
const outDir = fileURLToPath(new URL("../docs/screenshots/", import.meta.url));
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
for (const [app, baseURL] of Object.entries(apps)) {
  const context = await browser.newContext({ baseURL, viewport: { width: 1000, height: 720 } });
  const page = await context.newPage();
  await page.goto("/");
  await page.locator("#username").fill("alice");
  await page.locator("#password").fill("alice");
  await page.locator("#kc-login").click();
  await page.getByRole("heading", { name: "Dashboard" }).waitFor();

  for (const latency of latencies) {
    await page.goto(`/?latency=${latency}`);
    const overlay = page.getByRole("complementary", { name: "Initial Load timings" });
    await overlay.getByText("Data visible").waitFor();
    await page.waitForFunction(() => performance.getEntriesByName("data-visible", "mark").length > 0);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${outDir}${app}-${latency}ms.png` });
    console.log(app, latency, (await overlay.innerText()).replace(/\n/g, " "));
  }
  await context.close();
}
await browser.close();
