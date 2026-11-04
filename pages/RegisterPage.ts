import { Locator, Page } from "@playwright/test";

export type CustomerRegistrationData = {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  password: string;
};

export class RegisterPage {
  private readonly page: Page;

  // Locators
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly telephoneInput: Locator;
  private readonly passwordInput: Locator;
  private readonly passwordConfirmInput: Locator;
  private readonly privacyAgreementCheckbox: Locator;
  private readonly continueButton: Locator;
  private readonly successHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.firstNameInput = page.getByPlaceholder("First Name");
    this.lastNameInput = page.getByPlaceholder("Last Name");
    this.emailInput = page.getByPlaceholder("E-Mail");
    this.telephoneInput = page.getByPlaceholder("Telephone");
    this.passwordInput = page.getByPlaceholder("Password", { exact: true });
    this.passwordConfirmInput = page.getByPlaceholder("Password Confirm");
    this.privacyAgreementCheckbox = page.getByRole("checkbox");
    this.continueButton = page.getByRole("button", {
      name: "Continue",
      exact: true,
    });
    this.successHeading = page.getByRole("heading", {
      name: "Your Account Has Been Created!",
      exact: true,
    });
  }

  /**
   * Completes and submits the customer registration form.
   * @param customer - Dynamically generated customer registration details
   * @returns Promise<void>
   */
  async completeRegistration(
    customer: CustomerRegistrationData,
  ): Promise<void> {
    try {
      await this.firstNameInput.fill(customer.firstName);
      await this.lastNameInput.fill(customer.lastName);
      await this.emailInput.fill(customer.email);
      await this.telephoneInput.fill(customer.telephone);
      await this.passwordInput.fill(customer.password);
      await this.passwordConfirmInput.fill(customer.password);
      await this.privacyAgreementCheckbox.check();
      await Promise.all([
        this.page.waitForURL(/route=account\/success/),
        this.continueButton.click(),
      ]);
    } catch (error) {
      console.error("Error completing customer registration:", error);
      throw error;
    }
  }

  /**
   * Checks whether the registration success page is displayed.
   * @returns Promise<boolean> - true if account creation succeeded
   */
  async isRegistrationSuccessful(): Promise<boolean> {
    return this.successHeading.isVisible();
  }
}
