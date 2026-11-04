import { Locator, Page } from "@playwright/test";

export class LoginPage {
  private readonly page: Page;

  // Locators
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly loginHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.emailInput = page.getByRole("textbox", { name: "E-Mail Address" });
    this.passwordInput = page.getByRole("textbox", { name: "Password" });
    this.loginButton = page.getByRole("button", {
      name: "Login",
      exact: true,
    });
    this.loginHeading = page.getByRole("heading", {
      name: "Returning Customer",
      exact: true,
    });
  }

  /**
   * Checks whether the customer login form is displayed.
   * @returns Promise<boolean> - true if the returning-customer heading is visible
   */
  async isLoginPageVisible(): Promise<boolean> {
    return this.loginHeading.isVisible();
  }

  /**
   * Authenticates a customer with their registered credentials.
   * @param email - Customer email address
   * @param password - Customer password
   * @returns Promise<void>
   */
  async login(email: string, password: string): Promise<void> {
    try {
      await this.emailInput.fill(email);
      await this.passwordInput.fill(password);
      await Promise.all([
        this.page.waitForURL(/route=account\/account/),
        this.loginButton.click(),
      ]);
    } catch (error) {
      console.error("Error logging in the customer:", error);
      throw error;
    }
  }
}
