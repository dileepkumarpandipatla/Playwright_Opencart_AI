import { Locator, Page } from "@playwright/test";

export class CartPage {
  private readonly page: Page;

  // Locators
  private readonly cartHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.cartHeading = page.getByRole("heading", { name: /Shopping Cart/ });
  }

  /**
   * Checks whether the shopping cart page is displayed.
   * @returns Promise<boolean> - true if the cart heading is visible
   */
  async isCartPageVisible(): Promise<boolean> {
    return this.cartHeading.isVisible();
  }

  /**
   * Checks whether the requested product is present in the cart.
   * @param productName - Exact product name
   * @returns Promise<boolean> - true if the product row is visible
   */
  async containsProduct(productName: string): Promise<boolean> {
    return this.getProductRow(productName).isVisible();
  }

  /**
   * Reads the quantity entered for a cart product.
   * @param productName - Exact product name
   * @returns Promise<string> - Cart quantity
   */
  async getProductQuantity(productName: string): Promise<string> {
    return this.getProductRow(productName)
      .getByRole("textbox")
      .inputValue();
  }

  /**
   * Reads the product's unit price in the cart.
   * @param productName - Exact product name
   * @returns Promise<string> - Formatted unit price
   */
  async getProductUnitPrice(productName: string): Promise<string> {
    return this.getProductRow(productName)
      .getByRole("cell")
      .nth(4)
      .innerText();
  }

  /**
   * Reads the product line total in the cart.
   * @param productName - Exact product name
   * @returns Promise<string> - Formatted line total
   */
  async getProductLineTotal(productName: string): Promise<string> {
    return this.getProductRow(productName)
      .getByRole("cell")
      .nth(5)
      .innerText();
  }

  /**
   * Reads the final total from the cart summary.
   * @returns Promise<string> - Formatted cart total
   */
  async getCartTotal(): Promise<string> {
    return this.page
      .getByRole("row")
      .filter({ hasText: "Total:" })
      .getByRole("cell")
      .last()
      .innerText();
  }

  private getProductRow(productName: string): Locator {
    return this.page
      .getByRole("row")
      .filter({
        has: this.page.getByRole("link", {
          name: productName,
          exact: true,
        }),
      });
  }
}
