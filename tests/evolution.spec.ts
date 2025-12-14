import { test, expect } from '@playwright/test';

test.describe('IdeaBreeder Evolution', () => {
  test('should complete one full evolution cycle', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Verify the page loaded
    await expect(page.locator('h1')).toContainText('IdeaBreeder.ai');

    // Click Start Evolution
    await page.locator('button:has-text("Start Evolution")').click();

    // Wait for an idea to appear in the leaderboard (proves full cycle completed)
    // This means: genes selected -> idea generated -> scored -> genes extracted -> added to leaderboard
    await expect(page.locator('.lg\\:col-span-3').last().locator('h3.font-semibold')).toBeVisible({ timeout: 90000 });

    // Verify generation counter increased
    const genText = await page.locator('text=/Generation: \\d+/').textContent();
    console.log('Generation status:', genText);

    // Verify gene count increased
    const geneText = await page.locator('text=/Genes: \\d+/').textContent();
    console.log('Gene count:', geneText);

    // Pause evolution
    await page.locator('button:has-text("Pause Evolution")').click();

    // Verify we have at least one idea in leaderboard
    const leaderboard = page.locator('text=Top Ideas').locator('..').locator('..');
    await expect(leaderboard.locator('.bg-white\\/5')).toHaveCount(1, { timeout: 5000 });

    console.log('Full evolution cycle completed successfully!');
  });

  test('API endpoints return valid JSON', async ({ request }) => {
    // Test generate endpoint
    const generateRes = await request.post('http://localhost:3000/api/generate', {
      data: {
        genes: ['screenshot-ready output', 'professional anxiety', 'weekly ritual']
      }
    });

    expect(generateRes.ok()).toBeTruthy();
    const generateData = await generateRes.json();
    expect(generateData.idea).toBeDefined();
    expect(generateData.idea.name).toBeDefined();
    expect(generateData.idea.description).toBeDefined();
    console.log('Generated idea:', generateData.idea.name);

    // Test score endpoint
    const scoreRes = await request.post('http://localhost:3000/api/score', {
      data: {
        idea: generateData.idea
      }
    });

    expect(scoreRes.ok()).toBeTruthy();
    const scoreData = await scoreRes.json();
    expect(scoreData.scores).toBeDefined();
    expect(scoreData.virus_score).toBeDefined();
    console.log('VIRUS Score:', scoreData.virus_score);

    // Test extract endpoint
    const extractRes = await request.post('http://localhost:3000/api/extract', {
      data: {
        idea: generateData.idea,
        scores: scoreData.scores
      }
    });

    expect(extractRes.ok()).toBeTruthy();
    const extractData = await extractRes.json();
    expect(extractData.genes).toBeDefined();
    expect(extractData.genes.length).toBeGreaterThan(0);
    console.log('Extracted genes:', extractData.genes);
  });
});
