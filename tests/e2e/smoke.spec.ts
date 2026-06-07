import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const TEST_EMAIL = "test@pdbclad.local";
const TEST_PASSWORD = "testpassword123";

test.describe("Smoke — baseline", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /pdbclad/i })).toBeVisible();

    const dir = path.join("tests", "visual", "output");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, "login.png") });
  });

  test("login and reach dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should land on dashboard, not stay on /login
    await expect(page).not.toHaveURL(/login/, { timeout: 8000 });
    await page.screenshot({
      path: path.join("tests", "visual", "output", "dashboard.png"),
    });
  });
});
