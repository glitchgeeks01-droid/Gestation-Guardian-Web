const { test, expect } = require('@playwright/test');

// Clinical Config
const DEV_URL = 'http://localhost:3000'; 

test.describe('GG Doctor Dashboard - Standard Dashboard Protocol', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(DEV_URL, { waitUntil: 'domcontentloaded' });
  });

  test('Protocol 01: Core Systems & Data Integrity', async ({ page }) => {
    // 1. Verify Branding
    await expect(page.locator('body')).toContainText('GG Doctor Dashboard');
    
    // 2. Verify Patient Grid Load (Looking for our initial simulated patients)
    // We check if the "Alice R." card exists
    await expect(page.getByText('Alice R.')).toBeVisible();
    await expect(page.getByText('RPM-092')).toBeVisible();
  });

  test('Protocol 02: Sidebar Filter Engine', async ({ page }) => {
    // 1. Click the 'Critical' filter in the sidebar
    // Adjusting selector to find the button containing "Critical"
    await page.getByRole('button', { name: /critical/i }).click();

    // 2. Assert Triage Accuracy
    // Alice R. is Critical, Sarah J. is Stable.
    await expect(page.getByText('Alice R.')).toBeVisible();
    await expect(page.getByText('Sarah J.')).not.toBeVisible();
  });

  test('Protocol 03: Search Engine Precision', async ({ page }) => {
    const search = page.getByPlaceholder(/search/i);
    
    // Search by ID
    await search.fill('RPM-114');
    await expect(page.getByText('Maya T.')).toBeVisible();
    
    // Ensure others are hidden
    await expect(page.getByText('Alice R.')).not.toBeVisible();
  });

  test('Protocol 04: Navigation to Deep-Dive Analytics', async ({ page }) => {
    // 1. Click on patient card — new UI opens a slide-out panel first
    await page.getByText('Alice R.').first().click();

    // 2. Wait for panel, then click 'View Full Clinical Record'
    await expect(page.locator('#view-details-btn')).toBeVisible();
    await page.locator('#view-details-btn').click();

    // 3. Verify routing to patient-detail page (serve may strip .html extension)
    await expect(page).toHaveURL(/patient-detail/, { timeout: 10000 });

    // 4. Verify the detail page loaded the correct patient
    await expect(page.locator('#detail-name')).toHaveText('Alice R.', { timeout: 10000 });
  });

  test('Protocol 05: Telemetry Pulse (IoT Simulation Check)', async ({ page }) => {
    // Grab a heart rate value from the grid
    // We look for a number followed by "BPM"
    const hrValue = page.locator('text=/\\d+ BPM/').first();
    
    const initialText = await hrValue.innerText();
    
    // Wait for the JS simulation loop (2 seconds)
    await page.waitForTimeout(2200);
    
    const updatedText = await hrValue.innerText();
    
    // Static numbers in a live monitor mean the sensor is dead.
    // This confirms the 'setInterval' in your index.html is working.
    expect(initialText).not.toBe(updatedText);
  });

});