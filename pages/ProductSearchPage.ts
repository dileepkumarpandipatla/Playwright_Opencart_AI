import { Locator, Page } from "@playwright/test";

export class ProductSearchPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Opens a product from the catalog search results.
   * @param productName - Exact product name to open
   * @returns Promise<void>
   */
  async openProduct(productName: string): Promise<void> {
    try {
      const productLink = this.page
        .getByRole("heading", { name: productName, exact: true })
        .getByRole("link");

      await Promise.all([
        this.page.waitForURL(/route=product\/product/),
        productLink.click(),
      ]);
    } catch (error) {
      console.error(`Error opening product "${productName}":`, error);
      throw error;
    }
  }

  /**
   * Checks whether a product appears in the search results.
   * @param productName - Exact product name to find
   * @returns Promise<boolean> - true if the product result is visible
   */
  async containsProduct(productName: string): Promise<boolean> {
    return this.page
      .getByRole("heading", { name: productName, exact: true })
      .isVisible();
  }
}
