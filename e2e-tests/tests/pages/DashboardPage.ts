import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly dashboardHeader: Locator;
  readonly analyticsCards: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboardHeader = page.locator('h1:has-text("Dashboard"), .dashboard-header');
    this.analyticsCards = page.locator('.ref-card, .analytics-card, mat-card');
  }

  async navigate() {
    await super.navigate('/dashboard');
  }

  async getCardCount(): Promise<number> {
    return await this.analyticsCards.count();
  }
}
