import { test, expect } from '@playwright/test';

const BASE_URL = 'https://ideabreeder-ai.netlify.app';

test.describe('Deployed Pages Verification', () => {
  test('Shake Alert page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/shake`);

    // Check title
    await expect(page.locator('h1')).toContainText('Shake Alert');

    // Check for stats section
    await expect(page.getByText('Quakes', { exact: true })).toBeVisible();

    console.log('✅ Shake Alert page loaded successfully');
  });

  test('Soulmate Finder page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/soulmate`);

    // Check for the start screen
    await expect(page.locator('text=Find Your Soulmate')).toBeVisible();
    await expect(page.locator('text=Begin Your Journey')).toBeVisible();

    console.log('✅ Soulmate Finder page loaded successfully');
  });

  test('Soulmate versions page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/soulmate/versions`);

    // Check for version cards (using h2 to be specific)
    await expect(page.locator('h2:has-text("Light & Clean")')).toBeVisible();
    await expect(page.locator('h2:has-text("Dark Romantic")')).toBeVisible();
    await expect(page.locator('h2:has-text("Glassmorphism")')).toBeVisible();

    console.log('✅ Soulmate versions page loaded successfully');
  });

  test('DataGold page still works', async ({ page }) => {
    await page.goto(`${BASE_URL}/datagold`);

    // Should show either discovery mode or browse mode
    const hasContent = await page.locator('text=Did You Know').or(page.locator('text=Browse')).isVisible();
    expect(hasContent).toBeTruthy();

    console.log('✅ DataGold page loaded successfully');
  });
});
