import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import { Routes } from "../../api/endpoints/routes";
import { RandomDataUtil } from "../../utils/dataGenerator";

dotenv.config();

test.describe("Products API Tests", () => {
  // ---------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------

  const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;
  const PRODUCT_ID = Number(process.env.PRODUCT_ID || 1);
  const LIMIT = Number(process.env.LIMIT || 3);

  // ---------------------------------------------------------
  // GET - Products
  // ---------------------------------------------------------

  test("GET - All Products @master @sanity @api", async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}${Routes.GET_ALL_PRODUCTS}`,
    );

    expect(response.status(), "The products request should succeed").toBe(200);

    const products = await response.json();
    expect(Array.isArray(products), "Products should be returned as an array").toBe(
      true,
    );
    expect(products.length, "At least one product should be returned").toBeGreaterThan(
      0,
    );

    for (const product of products) {
      expect(typeof product.id, "Each product should have a numeric ID").toBe(
        "number",
      );
      expect(typeof product.title, "Each product should have a title").toBe(
        "string",
      );
      expect(typeof product.price, "Each product should have a numeric price").toBe(
        "number",
      );
      expect(typeof product.category, "Each product should have a category").toBe(
        "string",
      );
      expect(typeof product.image, "Each product should have an image URL").toBe(
        "string",
      );
    }
  });

  test("GET - Product by ID @master @sanity @api", async ({ request }) => {
    const route = Routes.GET_PRODUCT_BY_ID.replace("{id}", String(PRODUCT_ID));
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status(), "The product request should succeed").toBe(200);

    const product = await response.json();
    expect(product.id, "The returned ID should match the requested ID").toBe(
      PRODUCT_ID,
    );
    expect(typeof product.title).toBe("string");
    expect(typeof product.price).toBe("number");
    expect(typeof product.category).toBe("string");
    expect(typeof product.image).toBe("string");
  });

  test("GET - Products with Limit @master @regression @api", async ({
    request,
  }) => {
    const route = Routes.GET_PRODUCTS_WITH_LIMIT.replace(
      "{limit}",
      String(LIMIT),
    );
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status(), "The limited products request should succeed").toBe(
      200,
    );

    const products = await response.json();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length, "The API should honor the requested product limit").toBe(
      LIMIT,
    );
  });

  test("GET - Products sorted ascending @master @regression @api", async ({
    request,
  }) => {
    const route = Routes.GET_PRODUCTS_SORTED.replace("{order}", "asc");
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status()).toBe(200);

    const products = await response.json();
    const ids = products.map((product: { id: number }) => product.id);
    expect(ids, "Product IDs should be in ascending order").toEqual(
      [...ids].sort((first, second) => first - second),
    );
  });

  test("GET - Products sorted descending @master @regression @api", async ({
    request,
  }) => {
    const route = Routes.GET_PRODUCTS_SORTED.replace("{order}", "desc");
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status()).toBe(200);

    const products = await response.json();
    const ids = products.map((product: { id: number }) => product.id);
    expect(ids, "Product IDs should be in descending order").toEqual(
      [...ids].sort((first, second) => second - first),
    );
  });

  test("GET - All Product Categories @master @sanity @api", async ({
    request,
  }) => {
    const response = await request.get(
      `${BASE_URL}${Routes.GET_ALL_CATEGORIES}`,
    );

    expect(response.status()).toBe(200);

    const categories = await response.json();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length, "At least one category should be returned").toBeGreaterThan(
      0,
    );
    expect(categories.every((category: unknown) => typeof category === "string")).toBe(
      true,
    );
  });

  test("GET - Products by Category @master @regression @api", async ({
    request,
  }) => {
    const category = "electronics";
    const route = Routes.GET_PRODUCTS_BY_CATEGORY.replace(
      "{category}",
      encodeURIComponent(category),
    );
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status()).toBe(200);

    const products = await response.json();
    expect(Array.isArray(products)).toBe(true);
    expect(
      products.length,
      "The selected category should contain products",
    ).toBeGreaterThan(0);
    expect(
      products.every((product: { category: string }) => product.category === category),
      "Every returned product should belong to the requested category",
    ).toBe(true);
  });

  // ---------------------------------------------------------
  // POST - Create
  // ---------------------------------------------------------

  test("POST - Create Product @master @regression @api", async ({ request }) => {
    const payload = RandomDataUtil.generateProductPayload();
    let createdId: number | undefined;

    try {
      const response = await request.post(
        `${BASE_URL}${Routes.CREATE_PRODUCT}`,
        { data: payload },
      );

      expect(response.status(), "Product creation should return status 201").toBe(
        201,
      );

      const created = await response.json();
      expect(Number.isInteger(created.id), "A product ID should be returned").toBe(
        true,
      );
      createdId = Number(created.id);
      expect(created).toMatchObject(payload);
    } finally {
      if (createdId !== undefined) {
        const cleanupRoute = Routes.DELETE_PRODUCT.replace(
          "{id}",
          String(createdId),
        );
        const cleanupResponse = await request.delete(
          `${BASE_URL}${cleanupRoute}`,
        );
        expect(cleanupResponse.status(), "The created product should be cleaned up").toBe(
          200,
        );
      }
    }
  });

  // ---------------------------------------------------------
  // PUT - Update
  // ---------------------------------------------------------

  test("PUT - Update Product @master @regression @api", async ({ request }) => {
    const payload = RandomDataUtil.generateUpdatedProductPayload();
    const route = Routes.UPDATE_PRODUCT.replace("{id}", String(PRODUCT_ID));
    const response = await request.put(`${BASE_URL}${route}`, { data: payload });

    expect(response.status(), "Product update should return status 200").toBe(200);

    const updated = await response.json();
    expect(updated.id, "The returned ID should match the updated product").toBe(
      PRODUCT_ID,
    );
    expect(updated).toMatchObject(payload);
  });

  // ---------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------

  test("DELETE - Product @master @regression @api", async ({ request }) => {
    const route = Routes.DELETE_PRODUCT.replace("{id}", String(PRODUCT_ID));
    const response = await request.delete(`${BASE_URL}${route}`);

    expect(response.status(), "Product deletion should return status 200").toBe(
      200,
    );

    const deleted = await response.json();
    expect(deleted.id, "The deleted product response should identify the product").toBe(
      PRODUCT_ID,
    );
  });
});
