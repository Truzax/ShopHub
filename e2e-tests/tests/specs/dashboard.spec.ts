import { test, expect } from '../fixtures';

test.describe('Dashboard Validation', () => {
  test('should load dashboard and render analytics cards', async ({ loginPage, dashboardPage }) => {
    await loginPage.login('admin@example.com', 'admin123'); // Needs auth fixture to bypass login
    await dashboardPage.page.waitForURL('/dashboard');
    
    // Wait for analytics cards to render
    await expect(dashboardPage.analyticsCards.first()).toBeVisible({ timeout: 10000 });
    
    // Check if cards are loaded
    const count = await dashboardPage.getCardCount();
    expect(count).toBeGreaterThan(0);
  });
});
