import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/login.html');
    // Check for a login form or google sign in button, broadly matching
    const loginFormOrButton = page.locator('form, button:has-text("Google"), [id*="google"], [id*="login"]');
    await expect(loginFormOrButton.first()).toBeVisible();
  });

  test('should load the main dashboard', async ({ page }) => {
    await page.goto('/');
    // Checking for sidebar or title
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toBeNull();
  });

  test('should load connect patient page', async ({ page }) => {
    await page.goto('/pages/connect-patient-record.html');
    const input = page.locator('input');
    await expect(input.first()).toBeVisible();
  });

  test('should load patient detail page gracefully', async ({ page }) => {
    let hasJsError = false;
    page.on('pageerror', () => {
      hasJsError = true;
    });
    await page.goto('/pages/patient-detail.html?id=nonexistent');
    expect(hasJsError).toBeFalsy();
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(0);
  });

  test('should load blood pressure detail page', async ({ page }) => {
    let hasJsError = false;
    page.on('pageerror', () => {
      hasJsError = true;
    });
    await page.goto('/pages/blood-pressure-detail.html');
    expect(hasJsError).toBeFalsy();
  });

  test('should load heart rate detail page', async ({ page }) => {
    let hasJsError = false;
    page.on('pageerror', () => {
      hasJsError = true;
    });
    await page.goto('/pages/heart-rate-detail.html');
    expect(hasJsError).toBeFalsy();
  });

  test('should have no console errors on dashboard', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    await page.goto('/');
    expect(consoleErrors.length).toBe(0);
  });

  test('sidebar navigation links should exist', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });
});
