import { test as base, expect } from "@playwright/test";
import dotenv from "dotenv";
import { AdminCustomerPage } from "../pages/AdminCustomerPage";
import { AccountPage } from "../pages/AccountPage";
import { CartPage } from "../pages/CartPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { ProductPage } from "../pages/ProductPage";
import { ProductSearchPage } from "../pages/ProductSearchPage";
import { RegisterPage } from "../pages/RegisterPage";

dotenv.config();

const appUrl = process.env.WEB_APP_URL;

if (!appUrl) {
  throw new Error("WEB_APP_URL must be set to run web tests.");
}

type PageFixtures = {
  adminCustomerPage: AdminCustomerPage;
  accountPage: AccountPage;
  cartPage: CartPage;
  homePage: HomePage;
  loginPage: LoginPage;
  productPage: ProductPage;
  productSearchPage: ProductSearchPage;
  registerPage: RegisterPage;
};

export const test = base.extend<PageFixtures>({
  adminCustomerPage: async ({ page }, use) => {
    await use(new AdminCustomerPage(page));
  },
  accountPage: async ({ page }, use) => {
    await use(new AccountPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  homePage: async ({ page }, use) => {
    await page.goto(appUrl);
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  productSearchPage: async ({ page }, use) => {
    await use(new ProductSearchPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
});

test.afterEach(async ({ page, context }) => {
  if (!page.isClosed()) {
    await page.close();
  }
  await context.close();
});

export { expect };
