import { test, expect } from "@playwright/test";
import path from "path";

const EMAIL = "test@pdbclad.local";
const PASS  = "testpassword123";

// Unique name per run so accumulated DB data never collides
const RUN_ID   = Date.now();
const AREA_NAME = `Test Area ${RUN_ID}`;
const AREA_RENAMED = `Test Area ${RUN_ID} Renamed`;

async function login(page: Parameters<Parameters<typeof test>[1]>[0]) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(PASS);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/login/, { timeout: 8000 });
}

test.describe("Areas CRUD", () => {
  test("areas page loads after login", async ({ page }) => {
    await login(page);
    await page.goto("/areas");
    await expect(page.getByRole("heading", { name: /areas/i })).toBeVisible();
    await page.screenshot({ path: path.join("tests", "visual", "output", "areas-page.png") });
  });

  test("create an area — button not stuck, area appears", async ({ page }) => {
    await login(page);
    await page.goto("/areas");

    await page.getByRole("button", { name: /add area/i }).click();
    await expect(page.getByPlaceholder(/e\.g\. Health/i)).toBeVisible();

    await page.getByPlaceholder(/e\.g\. Health/i).fill(AREA_NAME);
    await page.getByRole("button", { name: /^add area$/i }).click();

    // Form must close — not stuck
    await expect(page.getByPlaceholder(/e\.g\. Health/i)).not.toBeVisible({ timeout: 6000 });

    // Reload confirms server persisted it
    await page.reload();
    await expect(page.getByText(AREA_NAME, { exact: true })).toBeVisible();
    await page.screenshot({ path: path.join("tests", "visual", "output", "areas-created.png") });
  });

  test("edit an area name", async ({ page }) => {
    await login(page);
    await page.goto("/areas");

    // Click the edit button on the correct row
    await page.locator(".glass").filter({ hasText: AREA_NAME }).first().getByTestId("edit-area").click();

    // Wait for the edit form's name input
    const nameInput = page.getByTestId("edit-name-input");
    await nameInput.waitFor({ state: "visible", timeout: 5000 });
    await nameInput.click();
    await nameInput.press("Control+a");
    await nameInput.type(AREA_RENAMED);

    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByRole("button", { name: /^save$/i })).not.toBeVisible({ timeout: 6000 });

    await page.reload();
    await expect(page.getByText(AREA_RENAMED, { exact: true })).toBeVisible();
  });

  test("delete an area", async ({ page }) => {
    await login(page);
    await page.goto("/areas");

    page.once("dialog", (d) => d.accept());
    await page.locator(".glass").filter({ hasText: AREA_RENAMED }).first().getByTestId("delete-area").click();
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.getByText(AREA_RENAMED, { exact: true })).not.toBeVisible();
  });
});
