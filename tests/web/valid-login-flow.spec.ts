import { test, expect } from "../../fixtures/pageFixtures";

/**
 * Test Case: Valid customer login
 *
 * Tags: @master @sanity @regression @web
 *
 * Steps:
 * 1) Open the login page from My Account
 * 2) Verify the login form
 * 3) Authenticate with configured valid customer credentials
 * 4) Verify the account dashboard and authenticated navigation
 */
test("Valid Login Flow @master @sanity @regression @web", async ({
  page,
  homePage,
  loginPage,
  accountPage,
}) => {
  await test.step("1) Navigate to My Account → Login", async () => {
    await homePage.openLoginPage();
    await expect(page).toHaveURL(/route=account\/login/);
  });

  await test.step("2) Verify the login page is displayed", async () => {
    expect(await loginPage.isLoginPageVisible()).toBeTruthy();
  });

  await test.step("3) Log in with configured valid customer credentials", async () => {
    const email = process.env.APP_EMAIL;
    const password = process.env.APP_PASSWORD;

    if (!email || !password) {
      throw new Error("APP_EMAIL and APP_PASSWORD must be configured for web tests.");
    }

    await loginPage.login(email, password);
  });

  await test.step("4) Verify successful authentication and the account dashboard", async () => {
    await expect(page).toHaveURL(/route=account\/account/);
    expect(await accountPage.isAccountDashboardVisible()).toBeTruthy();
  });

  console.log("✅ Valid customer login completed successfully.");
});
