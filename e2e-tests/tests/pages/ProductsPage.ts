import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductsPage extends BasePage {
  readonly addProductButton: Locator;
  readonly productList: Locator;
  readonly productRows: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.addProductButton = page.locator('button:has-text("Add Product")');
    this.productList = page.locator('table, mat-table, .product-list');
    this.productRows = page.locator('tbody tr, mat-row, .product-item');
    this.searchInput = page.locator('input[placeholder*="Search"]');
  }

  async navigate() {
    const sidebarLink = this.page.locator('aside nav a[routerLink="/products"], aside nav a:has-text("Products")');
    try {
      await sidebarLink.waitFor({ state: 'visible', timeout: 5000 });
      await sidebarLink.click();
    } catch (e) {
      await super.navigate('/products');
    }
  }

  async searchProduct(term: string) {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(500); // Wait for debounce if any
  }
}
