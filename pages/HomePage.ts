import { Locator, Page } from "@playwright/test";

export class HomePage {
  private readonly page: Page;

  // Locators
  private readonly storeLogo: Locator;
  private readonly accountMenu: Locator;
  private readonly registerLink: Locator;
  private readonly loginLink: Locator;
  private readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.storeLogo = page.locator("#logo img");
    this.accountMenu = page.getByRole("link", { name: /My Account/ }).first();
    this.registerLink = page.getByRole("link", { name: "Register", exact: true });
    this.loginLink = page.getByRole("link", { name: "Login", exact: true });
    this.searchInput = page.getByRole("textbox", { name: "Search" });
  }

  /**
   * Checks whether the storefront is displayed.
   * @returns Promise<boolean> - true if the store logo is visible
   */
  async isStorefrontVisible(): Promise<boolean> {
    return this.storeLogo.isVisible();
  }

  /**
   * Opens the customer registration page.
   * @returns Promise<void>
   */
  async openRegistrationPage(): Promise<void> {
    try {
      if (!(await this.registerLink.isVisible())) {
        await this.accountMenu.click();
      }
      await this.registerLink.click();
    } catch (error) {
      console.error("Error opening the registration page:", error);
      throw error;
    }
  }

  /**
   * Opens the customer login page.
   * @returns Promise<void>
   */
  async openLoginPage(): Promise<void> {
    try {
      if (!(await this.loginLink.isVisible())) {
        await this.accountMenu.click();
      }
      await this.loginLink.click();
    } catch (error) {
      console.error("Error opening the login page:", error);
      throw error;
    }
  }

  /**
   * Checks whether the account menu offers the login option.
   * @returns Promise<boolean> - true if the customer is logged out
   */
  async isLoginOptionVisible(): Promise<boolean> {
    if (!(await this.loginLink.isVisible())) {
      await this.accountMenu.click();
    }
    return this.loginLink.isVisible();
  }

  /**
   * Searches the catalog for a product.
   * @param productName - Product name to search for
   * @returns Promise<void>
   */
  async searchForProduct(productName: string): Promise<void> {
    try {
      await this.searchInput.fill(productName);
      await Promise.all([
        this.page.waitForURL(/route=product\/search/),
        this.searchInput.press("Enter"),
      ]);
    } catch (error) {
      console.error(`Error searching for product "${productName}":`, error);
      throw error;
    }
  }
}
