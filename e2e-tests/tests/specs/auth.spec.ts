import { test, expect } from '../fixtures';

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ loginPage, dashboardPage }) => {
    // Assuming an admin user exists or seeded
    await loginPage.login('admin@example.com', 'admin123'); // Adjust based on seed data
    await dashboardPage.page.waitForURL('/dashboard');
    expect(await dashboardPage.getTitle()).toContain('ShopHub');
    await expect(dashboardPage.dashboardHeader).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ loginPage }) => {
    await loginPage.login('wrong@example.com', 'wrongpass');
    await expect(loginPage.errorMessage).toBeVisible();
  });
});
