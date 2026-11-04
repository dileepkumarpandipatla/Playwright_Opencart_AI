import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import { Routes } from "../../api/endpoints/routes";
import { RandomDataUtil } from "../../utils/dataGenerator";

dotenv.config();

test.describe("Authentication API Tests", () => {
  // ---------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------

  const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;

  // ---------------------------------------------------------
  // POST - Authentication
  // ---------------------------------------------------------

  test("POST - Login with valid credentials @master @sanity @api", async ({
    request,
  }) => {
    // FakeStore provides login fields for its seeded users, avoiding hard-coded credentials.
    const usersResponse = await request.get(
      `${BASE_URL}${Routes.GET_ALL_USERS}`,
    );
    expect(usersResponse.status(), "Seeded users must be available").toBe(200);

    const users = await usersResponse.json();
    expect(Array.isArray(users), "The users response must be an array").toBe(
      true,
    );
    expect(users.length, "At least one seeded user is required").toBeGreaterThan(
      0,
    );

    const seededUser = users[0] as {
      username: string;
      password: string;
    };
    expect(seededUser.username, "The seeded user must have a username").toBeTruthy();
    expect(seededUser.password, "The seeded user must have a password").toBeTruthy();

    const response = await request.post(
      `${BASE_URL}${Routes.AUTH_LOGIN}`,
      {
        data: {
          username: seededUser.username,
          password: seededUser.password,
        },
      },
    );

    expect(response.status(), "Valid credentials should return status 201").toBe(
      201,
    );

    const responseBody = await response.json();
    expect(typeof responseBody.token, "The response must include a token").toBe(
      "string",
    );
    expect(responseBody.token.length, "The token must not be empty").toBeGreaterThan(
      0,
    );
  });

  test("POST - Login with invalid credentials @master @regression @api", async ({
    request,
  }) => {
    const response = await request.post(
      `${BASE_URL}${Routes.AUTH_LOGIN}`,
      { data: RandomDataUtil.generateInvalidLoginPayload() },
    );

    expect(response.status(), "Invalid credentials should return status 401").toBe(
      401,
    );

    const responseBody = await response.text();
    expect(responseBody, "The API should explain why authentication failed").toBe(
      "username or password is incorrect",
    );
  });
});
