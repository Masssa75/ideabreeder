import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3005';

test.describe('Local Pages Verification', () => {
  test('Shake Alert page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/shake`);

    // Check title
    await expect(page.locator('h1')).toContainText('Shake Alert');

    // Check for stats
    await expect(page.locator('text=QUAKES')).toBeVisible();

    console.log('✅ Shake Alert page loaded successfully');
  });

  test('Soulmate Finder page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/soulmate`);

    // Check for the start screen
    await expect(page.locator('text=Find Your Soulmate')).toBeVisible();

    console.log('✅ Soulmate Finder page loaded successfully');
  });

  test('Soulmate can start interview', async ({ page }) => {
    await page.goto(`${BASE_URL}/soulmate`);

    // Click start button
    await page.click('text=Begin Your Journey');

    // Wait for AI response (may take a few seconds)
    await expect(page.locator('.bg-white\\/10')).toBeVisible({ timeout: 30000 });

    console.log('✅ Soulmate interview started successfully');
  });

  test('Soulmate versions page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/soulmate/versions`);

    // Check for version cards
    await expect(page.locator('text=Light & Clean')).toBeVisible();
    await expect(page.locator('text=Dark Romantic')).toBeVisible();

    console.log('✅ Soulmate versions page loaded successfully');
  });
});
