import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import { Routes } from "../../api/endpoints/routes";
import { RandomDataUtil } from "../../utils/dataGenerator";

dotenv.config();

test.describe("Users API Tests", () => {
  // ---------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------

  const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;
  const USER_ID = Number(process.env.USER_ID || 1);
  const LIMIT = Number(process.env.LIMIT || 3);

  // ---------------------------------------------------------
  // GET - Users
  // ---------------------------------------------------------

  test("GET - All Users @master @sanity @api", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${Routes.GET_ALL_USERS}`);

    expect(response.status(), "The users request should succeed").toBe(200);

    const users = await response.json();
    expect(Array.isArray(users), "Users should be returned as an array").toBe(
      true,
    );
    expect(users.length, "At least one user should be returned").toBeGreaterThan(
      0,
    );
  });

  test("GET - User by ID @master @sanity @api", async ({ request }) => {
    const route = Routes.GET_USER_BY_ID.replace("{id}", String(USER_ID));
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status(), "The user request should succeed").toBe(200);

    const user = await response.json();
    expect(user.id, "The returned ID should match the requested ID").toBe(USER_ID);
    expect(typeof user.email).toBe("string");
    expect(typeof user.username).toBe("string");
    expect(typeof user.name.firstname).toBe("string");
    expect(typeof user.name.lastname).toBe("string");
  });

  test("GET - Users with Limit @master @regression @api", async ({
    request,
  }) => {
    const route = Routes.GET_USERS_WITH_LIMIT.replace(
      "{limit}",
      String(LIMIT),
    );
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status()).toBe(200);

    const users = await response.json();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length, "The API should honor the requested user limit").toBe(
      LIMIT,
    );
  });

  test("GET - Users sorted ascending @master @regression @api", async ({
    request,
  }) => {
    const route = Routes.GET_USERS_SORTED.replace("{order}", "asc");
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status()).toBe(200);

    const users = await response.json();
    const ids = users.map((user: { id: number }) => user.id);
    expect(ids, "User IDs should be in ascending order").toEqual(
      [...ids].sort((first, second) => first - second),
    );
  });

  test("GET - Users sorted descending @master @regression @api", async ({
    request,
  }) => {
    const route = Routes.GET_USERS_SORTED.replace("{order}", "desc");
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status()).toBe(200);

    const users = await response.json();
    const ids = users.map((user: { id: number }) => user.id);
    expect(ids, "User IDs should be in descending order").toEqual(
      [...ids].sort((first, second) => second - first),
    );
  });

  // ---------------------------------------------------------
  // POST - Create
  // ---------------------------------------------------------

  test("POST - Create User @master @regression @api", async ({ request }) => {
    const payload = RandomDataUtil.generateUserPayload();
    let createdId: number | undefined;

    try {
      const response = await request.post(`${BASE_URL}${Routes.CREATE_USER}`, {
        data: payload,
      });

      expect(response.status(), "User creation should return status 201").toBe(
        201,
      );

      const created = await response.json();
      expect(Number.isInteger(created.id), "A user ID should be returned").toBe(
        true,
      );
      createdId = Number(created.id);
      expect(created, "The API returns the generated user ID").toEqual({
        id: createdId,
      });
    } finally {
      if (createdId !== undefined) {
        const cleanupRoute = Routes.DELETE_USER.replace(
          "{id}",
          String(createdId),
        );
        const cleanupResponse = await request.delete(
          `${BASE_URL}${cleanupRoute}`,
        );
        expect(cleanupResponse.status(), "The created user should be cleaned up").toBe(
          200,
        );
      }
    }
  });

  // ---------------------------------------------------------
  // PUT - Update
  // ---------------------------------------------------------

  test("PUT - Update User @master @regression @api", async ({ request }) => {
    const payload = RandomDataUtil.generateUserUpdatePayload();
    const route = Routes.UPDATE_USER.replace("{id}", String(USER_ID));
    const response = await request.put(`${BASE_URL}${route}`, { data: payload });

    expect(response.status(), "User update should return status 200").toBe(200);

    const updated = await response.json();
    expect(updated).toMatchObject(payload);
  });

  // ---------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------

  test("DELETE - User @master @regression @api", async ({ request }) => {
    const route = Routes.DELETE_USER.replace("{id}", String(USER_ID));
    const response = await request.delete(`${BASE_URL}${route}`);

    expect(response.status(), "User deletion should return status 200").toBe(200);

    const deleted = await response.json();
    expect(deleted.id, "The deleted user response should identify the user").toBe(
      USER_ID,
    );
  });
});
