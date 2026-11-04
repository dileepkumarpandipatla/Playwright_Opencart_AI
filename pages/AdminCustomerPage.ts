import { Locator, Page } from "@playwright/test";

export type AdminCustomerDetails = {
  fullName: string;
  email: string;
  status: string;
};

export class AdminCustomerPage {
  private readonly page: Page;

  // Locators
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly securityNoticeCloseButton: Locator;
  private readonly customersMenu: Locator;
  private readonly customersListLink: Locator;
  private readonly emailFilterInput: Locator;
  private readonly filterButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.usernameInput = page.getByRole("textbox", { name: "Username" });
    this.passwordInput = page.getByRole("textbox", { name: "Password" });
    this.loginButton = page.getByRole("button", { name: /Login/ });
    this.securityNoticeCloseButton = page.locator(
      "#modal-security button.close",
    );
    this.customersMenu = page
      .locator("#menu")
      .getByRole("link", { name: /Customers/ })
      .first();
    this.customersListLink = page.locator(
      '#menu a[href*="route=customer/customer&"]',
    );
    this.emailFilterInput = page.getByPlaceholder("E-Mail");
    this.filterButton = page.locator("#button-filter");
  }

  /**
   * Opens the admin portal, signs in, and dismisses its initial security notice.
   * @param adminUrl - Configured OpenCart admin URL
   * @param username - Administrator username
   * @param password - Administrator password
   * @returns Promise<void>
   */
  async login(
    adminUrl: string,
    username: string,
    password: string,
  ): Promise<void> {
    try {
      await this.page.goto(adminUrl);
      await this.usernameInput.fill(username);
      await this.passwordInput.fill(password);
      await Promise.all([
        this.page.waitForURL(/route=common\/dashboard/),
        this.loginButton.click(),
      ]);

      if (await this.securityNoticeCloseButton.isVisible()) {
        await this.securityNoticeCloseButton.click();
      }
    } catch (error) {
      console.error("Error signing in to the OpenCart admin portal:", error);
      throw error;
    }
  }

  /**
   * Opens the customer list and filters it by email address.
   * @param email - Unique email address to search for
   * @returns Promise<void>
   */
  async searchCustomerByEmail(email: string): Promise<void> {
    try {
      if (!(await this.customersListLink.isVisible())) {
        await this.customersMenu.click();
      }
      await Promise.all([
        this.page.waitForURL(/route=customer\/customer/),
        this.customersListLink.click(),
      ]);
      await this.emailFilterInput.fill(email);
      await this.filterButton.click();
      await this.getCustomerRow(email).waitFor({ state: "visible" });
    } catch (error) {
      console.error("Error searching for a customer in the admin portal:", error);
      throw error;
    }
  }

  /**
   * Reads the matching customer name, email, and status from the admin list.
   * @param email - Unique email address identifying the customer row
   * @returns Promise<AdminCustomerDetails> - Customer details shown in admin
   */
  async getCustomerDetails(email: string): Promise<AdminCustomerDetails> {
    const cells = this.getCustomerRow(email).getByRole("cell");

    return {
      fullName: await cells.nth(1).innerText(),
      email: await cells.nth(2).innerText(),
      status: await cells.nth(4).innerText(),
    };
  }

  private getCustomerRow(email: string): Locator {
    return this.page
      .getByRole("row")
      .filter({
        has: this.page.getByRole("cell", { name: email, exact: true }),
      });
  }
}
