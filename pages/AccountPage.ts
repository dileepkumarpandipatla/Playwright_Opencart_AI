import { Locator, Page } from "@playwright/test";

export class AccountPage {
  private readonly page: Page;

  // Locators
  private readonly accountHeading: Locator;
  private readonly accountMenu: Locator;
  private readonly logoutLink: Locator;
  private readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.accountHeading = page
      .locator("#content")
      .getByRole("heading", { name: "My Account", exact: true });
    this.accountMenu = page.getByRole("link", { name: /My Account/ }).first();
    this.logoutLink = page.getByRole("link", { name: "Logout", exact: true });
    this.loginLink = page.getByRole("link", { name: "Login", exact: true });
  }

  /**
   * Checks whether the authenticated customer account page is displayed.
   * @returns Promise<boolean> - true if the account heading is visible
   */
  async isAccountDashboardVisible(): Promise<boolean> {
    return this.accountHeading.isVisible();
  }

  /**
   * Logs out the authenticated customer.
   * @returns Promise<void>
   */
  async logout(): Promise<void> {
    try {
      if (!(await this.logoutLink.isVisible())) {
        await this.accountMenu.click();
      }
      await this.logoutLink.click();
    } catch (error) {
      console.error("Error logging out the customer:", error);
      throw error;
    }
  }

  /**
   * Checks whether the current session is logged out.
   * @returns Promise<boolean> - true if the account menu offers Login
   */
  async isLoggedOut(): Promise<boolean> {
    if (!(await this.loginLink.isVisible())) {
      await this.accountMenu.click();
    }
    return this.loginLink.isVisible();
  }
}
