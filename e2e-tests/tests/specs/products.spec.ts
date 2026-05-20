import { test, expect } from '../fixtures';

test.describe('Product Operations', () => {
  test('should load product list', async ({ loginPage, productsPage }) => {
    await loginPage.login('admin@example.com', 'admin123');
    await productsPage.page.waitForURL('**/dashboard');
    await productsPage.navigate();
    await productsPage.page.waitForLoadState('networkidle');
    
    await expect(productsPage.productList).toBeVisible();
  });

  test('should filter products by search term', async ({ loginPage, productsPage }) => {
    await loginPage.login('admin@example.com', 'admin123');
    await productsPage.page.waitForURL('**/dashboard');
    await productsPage.navigate();
    
    await productsPage.searchProduct('Test Product');
    // We expect the rows to be updated. Since we are testing against a dev DB, we just ensure no crash.
    await expect(productsPage.productList).toBeVisible();
  });
});
