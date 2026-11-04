/**
 * Test Case: Complete customer registration and shopping journey
 *
 * Tags: @master @sanity @regression @web @end-to-end
 *
 * Steps:
 * 1) Open the storefront and register a unique customer
 * 2) Verify registration, log out, and authenticate again
 * 3) Search for MacBook, add one to the cart, and validate cart values
 */

import { test, expect } from "../../fixtures/pageFixtures";
import { Helper } from "../../utils/helper";
import { RandomDataUtil } from "../../utils/dataGenerator";

test(
  "End-to-end shopping flow test @master @sanity @regression @web @end-to-end",
  async ({
    accountPage,
    cartPage,
    homePage,
    loginPage,
    productPage,
    productSearchPage,
    registerPage,
    page,
  }) => {
    test.setTimeout(60_000);

    const customer = RandomDataUtil.generateCustomerRegistrationData();
    const { productName, productQuantity, totalPrice } =
      Helper.getProductDetails();
    const pageErrors: string[] = [];

    page.on("pageerror", (error) => pageErrors.push(error.message));

    await test.step("1) Open the application", async () => {
      expect(await homePage.isStorefrontVisible()).toBeTruthy();
    });

    await test.step("2) Register a new customer with unique data", async () => {
      await homePage.openRegistrationPage();
      await registerPage.completeRegistration(customer);
    });

    await test.step("3) Verify successful registration", async () => {
      expect(await registerPage.isRegistrationSuccessful()).toBeTruthy();
    });

    await test.step("4) Log out of the new customer account", async () => {
      await accountPage.logout();
      expect(await accountPage.isLoggedOut()).toBeTruthy();
    });

    await test.step("5) Log in with the newly created credentials", async () => {
      await homePage.openLoginPage();
      await loginPage.login(customer.email, customer.password);
    });

    await test.step("6) Verify successful authentication", async () => {
      expect(await accountPage.isAccountDashboardVisible()).toBeTruthy();
    });

    await test.step("7) Search for a known product", async () => {
      await homePage.searchForProduct(productName);
      expect(
        await productSearchPage.containsProduct(productName),
      ).toBeTruthy();
    });

    await test.step("8) Open the product details page", async () => {
      await productSearchPage.openProduct(productName);
      expect(
        await productPage.isProductDetailsVisible(productName),
      ).toBeTruthy();
    });

    await test.step("9) Add the product to the cart", async () => {
      expect(await productPage.getDisplayedPrice()).toBe(totalPrice);
      await productPage.setQuantity(productQuantity);
      await productPage.addToCart();
      expect(await productPage.isAddToCartSuccessful()).toBeTruthy();
    });

    await test.step("10) Open the shopping cart", async () => {
      await productPage.openShoppingCart();
      expect(await cartPage.isCartPageVisible()).toBeTruthy();
    });

    await test.step("11) Verify the correct product is in the cart", async () => {
      expect(await cartPage.containsProduct(productName)).toBeTruthy();
    });

    await test.step("12) Verify the product quantity", async () => {
      expect(await cartPage.getProductQuantity(productName)).toBe(
        productQuantity,
      );
    });

    await test.step("13) Verify the product price", async () => {
      expect(await cartPage.getProductUnitPrice(productName)).toBe(totalPrice);
    });

    await test.step("14) Verify the applicable cart total", async () => {
      expect(await cartPage.getProductLineTotal(productName)).toBe(totalPrice);
      expect(await cartPage.getCartTotal()).toBe(totalPrice);
    });

    await test.step("15) Verify the journey finishes without page errors", async () => {
      expect(pageErrors).toEqual([]);
    });

    console.log(`✅ Completed shopping flow for ${customer.email}`);
  },
);
