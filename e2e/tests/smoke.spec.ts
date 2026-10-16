import { expect, test } from "@playwright/test";

test("log in, read the Dashboard, open an Order and log out", async ({ page }) => {
  await page.goto("/");

  await page.locator("#username").fill("alice");
  await page.locator("#password").fill("alice");
  await page.locator("#kc-login").click();

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Total revenue")).toBeVisible();
  await expect(page.getByText("Average order value")).toBeVisible();

  const orderLinks = page.getByRole("table").getByRole("link");
  await expect(orderLinks.first()).toBeVisible();
  const number = (await orderLinks.first().innerText()).trim();
  await orderLinks.first().click();

  await expect(page.getByRole("heading", { name: number })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Product" })).toBeVisible();
  expect(await page.getByRole("table").locator("tbody tr").count()).toBeGreaterThan(0);

  await page.getByRole("link", { name: /Back to the Dashboard/ }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.locator("#username")).toBeVisible();
});
