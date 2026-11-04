import { Locator, Page } from "@playwright/test";

export class ProductPage {
  private readonly page: Page;

  // Locators
  private readonly quantityInput: Locator;
  private readonly addToCartButton: Locator;
  private readonly addToCartSuccessMessage: Locator;
  private readonly shoppingCartLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.quantityInput = page.getByRole("textbox", { name: "Qty" });
    this.addToCartButton = page.getByRole("button", {
      name: "Add to Cart",
      exact: true,
    });
    this.addToCartSuccessMessage = page.getByText(
      "Success: You have added",
      { exact: false },
    );
    this.shoppingCartLink = this.addToCartSuccessMessage.getByRole("link", {
      name: "shopping cart",
      exact: true,
    });
  }

  /**
   * Checks whether the requested product details page is displayed.
   * @param productName - Exact product name
   * @returns Promise<boolean> - true if the product heading is visible
   */
  async isProductDetailsVisible(productName: string): Promise<boolean> {
    return this.page
      .getByRole("heading", { name: productName, exact: true })
      .isVisible();
  }

  /**
   * Reads the displayed tax-inclusive product price.
   * @returns Promise<string> - Formatted product price
   */
  async getDisplayedPrice(): Promise<string> {
    return this.page.getByRole("heading", { level: 2 }).innerText();
  }

  /**
   * Sets the quantity for the product.
   * @param quantity - Quantity to add to the cart
   * @returns Promise<void>
   */
  async setQuantity(quantity: string): Promise<void> {
    await this.quantityInput.fill(quantity);
  }

  /**
   * Adds the product to the shopping cart.
   * @returns Promise<void>
   */
  async addToCart(): Promise<void> {
    try {
      await this.addToCartButton.click();
      await this.addToCartSuccessMessage.waitFor({ state: "visible" });
    } catch (error) {
      console.error("Error adding product to cart:", error);
      throw error;
    }
  }

  /**
   * Checks whether the add-to-cart confirmation is displayed.
   * @returns Promise<boolean> - true if the cart confirmation is visible
   */
  async isAddToCartSuccessful(): Promise<boolean> {
    return this.addToCartSuccessMessage.isVisible();
  }

  /**
   * Opens the shopping cart from the add-to-cart confirmation.
   * @returns Promise<void>
   */
  async openShoppingCart(): Promise<void> {
    try {
      await Promise.all([
        this.page.waitForURL(/route=checkout\/cart/),
        this.shoppingCartLink.click(),
      ]);
    } catch (error) {
      console.error("Error opening the shopping cart:", error);
      throw error;
    }
  }
}
