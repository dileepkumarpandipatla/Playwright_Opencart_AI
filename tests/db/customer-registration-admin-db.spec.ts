import { expect, test } from "../../fixtures/pageFixtures";
import dotenv from "dotenv";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { RandomDataUtil } from "../../utils/dataGenerator";
import { executeQuery } from "../../utils/dbClient";

dotenv.config();

type CustomerRow = RowDataPacket & {
  customer_id: number;
  firstname: string;
  lastname: string;
  email: string;
  status: number;
  date_added: string;
};

test.describe("OpenCart Customer Registration Admin and Database Tests", () => {
  // ---------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------

  const WEB_APP_URL = process.env.WEB_APP_URL;
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_APP_URL = WEB_APP_URL
    ? new URL("admin/index.php", WEB_APP_URL).toString()
    : undefined;
  const EXPECTED_CUSTOMER_STATUS = 1;

  test("Register customer and validate admin and database records @master @regression @db @end-to-end", async ({
    adminCustomerPage,
    homePage,
    page,
    registerPage,
  }) => {
    test.setTimeout(60_000);

    if (!WEB_APP_URL || !ADMIN_APP_URL) {
      throw new Error("WEB_APP_URL must be configured to run this test.");
    }
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      throw new Error(
        "ADMIN_USERNAME and ADMIN_PASSWORD must be configured to run this test.",
      );
    }

    const customer = RandomDataUtil.generateCustomerRegistrationData();
    let registrationAttempted = false;

    try {
      await test.step("1) Register a unique customer through the storefront", async () => {
        expect(await homePage.isStorefrontVisible()).toBeTruthy();
        await homePage.openRegistrationPage();
        expect(await page.title()).toBe("Register Account");

        registrationAttempted = true;
        await registerPage.completeRegistration(customer);

        expect(await registerPage.isRegistrationSuccessful()).toBeTruthy();
      });

      await test.step("2) Verify the customer in the admin portal", async () => {
        await adminCustomerPage.login(
          ADMIN_APP_URL,
          ADMIN_USERNAME,
          ADMIN_PASSWORD,
        );
        await adminCustomerPage.searchCustomerByEmail(customer.email);

        const adminCustomer = await adminCustomerPage.getCustomerDetails(
          customer.email,
        );
        expect(
          adminCustomer.fullName,
          "The admin customer name should match the registered name",
        ).toBe(`${customer.firstName} ${customer.lastName}`);
        expect(
          adminCustomer.email,
          "The admin email should match the registered email",
        ).toBe(customer.email);
        expect(
          adminCustomer.status,
          "A newly registered customer should be enabled in admin",
        ).toBe("Enabled");
      });

      await test.step("3) Verify the customer record in MySQL", async () => {
        const customers = await executeQuery<CustomerRow[]>(
          `SELECT customer_id, firstname, lastname, email, status,
                  DATE_FORMAT(date_added, '%Y-%m-%d') AS date_added
           FROM oc_customer
           WHERE email = ?`,
          [customer.email],
        );

        expect(
          customers.length,
          "Exactly one database record should match the unique email",
        ).toBe(1);

        const databaseCustomer = customers[0];
        expect(databaseCustomer.firstname).toBe(customer.firstName);
        expect(databaseCustomer.lastname).toBe(customer.lastName);
        expect(databaseCustomer.email).toBe(customer.email);
        expect(databaseCustomer.status).toBe(EXPECTED_CUSTOMER_STATUS);
        expect(
          databaseCustomer.date_added,
          "The customer record should have a date_added value",
        ).toBeTruthy();
      });
    } finally {
      if (registrationAttempted) {
        await executeQuery<ResultSetHeader>(
          "DELETE FROM oc_customer WHERE email = ?",
          [customer.email],
        );
      }
    }

    console.log("✅ Customer registration passed admin and database validation.");
  });
});
