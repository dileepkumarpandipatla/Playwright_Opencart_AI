import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import { Routes } from "../../api/endpoints/routes";
import { RandomDataUtil } from "../../utils/dataGenerator";

dotenv.config();

test.describe("Carts API Tests", () => {
  // ---------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------

  const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;
  const CART_ID = Number(process.env.CART_ID || 1);
  const USER_ID = Number(process.env.USER_ID || 1);
  const PRODUCT_ID = Number(process.env.PRODUCT_ID || 1);
  const LIMIT = Number(process.env.LIMIT || 3);
  const START_DATE = process.env.START_DATE || "2019-01-01";
  const END_DATE = process.env.END_DATE || "2026-12-31";

  // ---------------------------------------------------------
  // GET - Carts
  // ---------------------------------------------------------

  test("GET - All Carts @master @sanity @api", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${Routes.GET_ALL_CARTS}`);

    expect(response.status(), "The carts request should succeed").toBe(200);

    const carts = await response.json();
    expect(Array.isArray(carts), "Carts should be returned as an array").toBe(
      true,
    );
    expect(carts.length, "At least one cart should be returned").toBeGreaterThan(
      0,
    );
  });

  test("GET - Cart by ID @master @sanity @api", async ({ request }) => {
    const route = Routes.GET_CART_BY_ID.replace("{id}", String(CART_ID));
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status(), "The cart request should succeed").toBe(200);

    const cart = await response.json();
    expect(cart.id, "The returned ID should match the requested ID").toBe(CART_ID);
    expect(typeof cart.userId).toBe("number");
    expect(Array.isArray(cart.products)).toBe(true);
  });

  test("GET - Carts by Date Range @master @regression @api", async ({
    request,
  }) => {
    const route = Routes.GET_CARTS_BY_DATE_RANGE
      .replace("{startdate}", encodeURIComponent(START_DATE))
      .replace("{enddate}", encodeURIComponent(END_DATE));
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status()).toBe(200);

    const carts = await response.json();
    expect(Array.isArray(carts)).toBe(true);

    const startTime = Date.parse(START_DATE);
    const endTime = Date.parse(`${END_DATE}T23:59:59.999Z`);
    expect(Number.isNaN(startTime), "The configured start date must be valid").toBe(
      false,
    );
    expect(Number.isNaN(endTime), "The configured end date must be valid").toBe(
      false,
    );

    for (const cart of carts) {
      const cartTime = Date.parse(cart.date);
      expect(Number.isNaN(cartTime), "Cart dates must be valid").toBe(false);
      expect(cartTime, "Each cart should be on or after the start date").toBeGreaterThanOrEqual(
        startTime,
      );
      expect(cartTime, "Each cart should be on or before the end date").toBeLessThanOrEqual(
        endTime,
      );
    }
  });

  test("GET - Carts by User @master @regression @api", async ({ request }) => {
    const route = Routes.GET_USER_CART.replace("{userId}", String(USER_ID));
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status()).toBe(200);

    const carts = await response.json();
    expect(Array.isArray(carts)).toBe(true);
    expect(
      carts.length,
      "The selected user should have at least one cart",
    ).toBeGreaterThan(0);
    expect(
      carts.every((cart: { userId: number }) => cart.userId === USER_ID),
      "Every returned cart should belong to the requested user",
    ).toBe(true);
  });

  test("GET - Carts with Limit @master @regression @api", async ({
    request,
  }) => {
    const route = Routes.GET_CARTS_WITH_LIMIT.replace(
      "{limit}",
      String(LIMIT),
    );
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status()).toBe(200);

    const carts = await response.json();
    expect(Array.isArray(carts)).toBe(true);
    expect(carts.length, "The API should honor the requested cart limit").toBe(
      LIMIT,
    );
  });

  test("GET - Carts sorted ascending @master @regression @api", async ({
    request,
  }) => {
    const route = Routes.GET_CARTS_SORTED.replace("{order}", "asc");
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status()).toBe(200);

    const carts = await response.json();
    const ids = carts.map((cart: { id: number }) => cart.id);
    expect(ids, "Cart IDs should be in ascending order").toEqual(
      [...ids].sort((first, second) => first - second),
    );
  });

  test("GET - Carts sorted descending @master @regression @api", async ({
    request,
  }) => {
    const route = Routes.GET_CARTS_SORTED.replace("{order}", "desc");
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status()).toBe(200);

    const carts = await response.json();
    const ids = carts.map((cart: { id: number }) => cart.id);
    expect(ids, "Cart IDs should be in descending order").toEqual(
      [...ids].sort((first, second) => second - first),
    );
  });

  // ---------------------------------------------------------
  // POST - Create
  // ---------------------------------------------------------

  test("POST - Create Cart @master @regression @api", async ({ request }) => {
    const generated = RandomDataUtil.generateCartPayload(USER_ID);
    const payload = {
      ...generated,
      products: [{ productId: PRODUCT_ID, quantity: 2 }],
    };
    let createdId: number | undefined;

    try {
      const response = await request.post(`${BASE_URL}${Routes.CREATE_CART}`, {
        data: payload,
      });

      expect(response.status(), "Cart creation should return status 201").toBe(
        201,
      );

      const created = await response.json();
      expect(Number.isInteger(created.id), "A cart ID should be returned").toBe(
        true,
      );
      createdId = Number(created.id);
      expect(created.userId).toBe(USER_ID);
      expect(created.products).toEqual(payload.products);
    } finally {
      if (createdId !== undefined) {
        const cleanupRoute = Routes.DELETE_CART.replace(
          "{id}",
          String(createdId),
        );
        const cleanupResponse = await request.delete(
          `${BASE_URL}${cleanupRoute}`,
        );
        expect(cleanupResponse.status(), "The created cart should be cleaned up").toBe(
          200,
        );
      }
    }
  });

  // ---------------------------------------------------------
  // PUT - Update
  // ---------------------------------------------------------

  test("PUT - Update Cart @master @regression @api", async ({ request }) => {
    const generated = RandomDataUtil.generateCartPayload(USER_ID);
    const payload = {
      ...generated,
      products: [{ productId: PRODUCT_ID, quantity: 2 }],
    };
    const updatedPayload = {
      ...payload,
      products: payload.products.map((product) => ({
        ...product,
        quantity: product.quantity + 1,
      })),
    };
    const route = Routes.UPDATE_CART.replace("{id}", String(CART_ID));
    const response = await request.put(`${BASE_URL}${route}`, {
      data: updatedPayload,
    });

    expect(response.status(), "Cart update should return status 200").toBe(200);

    const updated = await response.json();
    expect(updated.id).toBe(CART_ID);
    expect(updated.userId).toBe(USER_ID);
    expect(updated.products).toEqual(updatedPayload.products);
    expect(updated.products[0].quantity).toBe(
      payload.products[0].quantity + 1,
    );
  });

  // ---------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------

  test("DELETE - Cart @master @regression @api", async ({ request }) => {
    const route = Routes.DELETE_CART.replace("{id}", String(CART_ID));
    const response = await request.delete(`${BASE_URL}${route}`);

    expect(response.status(), "Cart deletion should return status 200").toBe(200);

    const deleted = await response.json();
    expect(deleted.id, "The deleted cart response should identify the cart").toBe(
      CART_ID,
    );
  });
});
