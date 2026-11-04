import Ajv from "ajv";
import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";
import { Routes } from "../../api/endpoints/routes";
import { DataProvider } from "../../utils/DataReader";
import { RandomDataUtil } from "../../utils/dataGenerator";

dotenv.config();

test.describe("API Response Schema Tests", () => {
  // ---------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------

  const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;
  const PRODUCT_ID = Number(process.env.PRODUCT_ID || 1);
  const USER_ID = Number(process.env.USER_ID || 1);
  const CART_ID = Number(process.env.CART_ID || 1);
  const ajv = new Ajv();

  // ---------------------------------------------------------
  // JSON Schema Validation
  // ---------------------------------------------------------

  test("GET - Validate Product Schema @master @regression @api", async ({
    request,
  }) => {
    const route = Routes.GET_PRODUCT_BY_ID.replace("{id}", String(PRODUCT_ID));
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status()).toBe(200);

    const product = await response.json();
    const schema = DataProvider.readJson(
      path.join(process.cwd(), "api", "schemas", "product_api_schema.json"),
    );
    const validate = ajv.compile(schema);

    expect(validate(product), ajv.errorsText(validate.errors)).toBe(true);
  });

  test("GET - Validate User Schema @master @regression @api", async ({
    request,
  }) => {
    const route = Routes.GET_USER_BY_ID.replace("{id}", String(USER_ID));
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status()).toBe(200);

    const user = await response.json();
    const schema = DataProvider.readJson(
      path.join(process.cwd(), "api", "schemas", "user_api_schema.json"),
    );
    const validate = ajv.compile(schema);

    expect(validate(user), ajv.errorsText(validate.errors)).toBe(true);
  });

  test("GET - Validate Cart Schema @master @regression @api", async ({
    request,
  }) => {
    const route = Routes.GET_CART_BY_ID.replace("{id}", String(CART_ID));
    const response = await request.get(`${BASE_URL}${route}`);

    expect(response.status()).toBe(200);

    const cart = await response.json();
    const schema = DataProvider.readJson(
      path.join(process.cwd(), "api", "schemas", "cart_api_schema.json"),
    );
    const validate = ajv.compile(schema);

    expect(validate(cart), ajv.errorsText(validate.errors)).toBe(true);
  });
});

test.describe.serial("API CRUD Workflow Tests", () => {
  // ---------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------

  const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;
  const USER_ID = Number(process.env.USER_ID || 1);
  const PRODUCT_ID = Number(process.env.PRODUCT_ID || 1);

  // ---------------------------------------------------------
  // Product CRUD Workflow
  // ---------------------------------------------------------

  test("POST/PUT/DELETE - Product CRUD Workflow @master @regression @api", async ({
    request,
  }) => {
    const payload = RandomDataUtil.generateProductPayload();
    let createdId: number | undefined;

    try {
      const createResponse = await request.post(
        `${BASE_URL}${Routes.CREATE_PRODUCT}`,
        { data: payload },
      );
      expect(createResponse.status(), "Product creation should return 201").toBe(
        201,
      );

      const created = await createResponse.json();
      expect(Number.isInteger(created.id), "A product ID should be returned").toBe(
        true,
      );
      createdId = Number(created.id);

      const updatePayload = RandomDataUtil.generateUpdatedProductPayload();
      const updateRoute = Routes.UPDATE_PRODUCT.replace(
        "{id}",
        String(createdId),
      );
      const updateResponse = await request.put(
        `${BASE_URL}${updateRoute}`,
        { data: updatePayload },
      );
      expect(updateResponse.status(), "Product update should return 200").toBe(
        200,
      );

      const updated = await updateResponse.json();
      expect(updated.id).toBe(createdId);
      expect(updated).toMatchObject(updatePayload);

      const deleteRoute = Routes.DELETE_PRODUCT.replace(
        "{id}",
        String(createdId),
      );
      const deleteResponse = await request.delete(
        `${BASE_URL}${deleteRoute}`,
      );
      expect(deleteResponse.status(), "Product deletion should return 200").toBe(
        200,
      );
      createdId = undefined;
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
  // User CRUD Workflow
  // ---------------------------------------------------------

  test("POST/PUT/DELETE - User CRUD Workflow @master @regression @api", async ({
    request,
  }) => {
    const payload = RandomDataUtil.generateUserPayload();
    let createdId: number | undefined;

    try {
      const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_USER}`, {
        data: payload,
      });
      expect(createResponse.status(), "User creation should return 201").toBe(201);

      const created = await createResponse.json();
      expect(Number.isInteger(created.id), "A user ID should be returned").toBe(
        true,
      );
      createdId = Number(created.id);

      const updatePayload = RandomDataUtil.generateUserUpdatePayload();
      const updateRoute = Routes.UPDATE_USER.replace(
        "{id}",
        String(createdId),
      );
      const updateResponse = await request.put(
        `${BASE_URL}${updateRoute}`,
        { data: updatePayload },
      );
      expect(updateResponse.status(), "User update should return 200").toBe(200);

      const updated = await updateResponse.json();
      expect(updated).toMatchObject(updatePayload);

      const deleteRoute = Routes.DELETE_USER.replace(
        "{id}",
        String(createdId),
      );
      const deleteResponse = await request.delete(
        `${BASE_URL}${deleteRoute}`,
      );
      expect(deleteResponse.status(), "User deletion should return 200").toBe(
        200,
      );
      createdId = undefined;
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
  // Cart CRUD Workflow
  // ---------------------------------------------------------

  test("POST/PUT/DELETE - Cart CRUD Workflow @master @regression @api", async ({
    request,
  }) => {
    const generated = RandomDataUtil.generateCartPayload(USER_ID);
    const payload = {
      ...generated,
      products: [{ productId: PRODUCT_ID, quantity: 2 }],
    };
    let createdId: number | undefined;

    try {
      const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_CART}`, {
        data: payload,
      });
      expect(createResponse.status(), "Cart creation should return 201").toBe(201);

      const created = await createResponse.json();
      expect(Number.isInteger(created.id), "A cart ID should be returned").toBe(
        true,
      );
      createdId = Number(created.id);
      expect(created.userId).toBe(USER_ID);
      expect(created.products).toEqual(payload.products);

      const updatedPayload = {
        ...payload,
        products: payload.products.map((product) => ({
          ...product,
          quantity: product.quantity + 1,
        })),
      };
      const updateRoute = Routes.UPDATE_CART.replace(
        "{id}",
        String(createdId),
      );
      const updateResponse = await request.put(
        `${BASE_URL}${updateRoute}`,
        { data: updatedPayload },
      );
      expect(updateResponse.status(), "Cart update should return 200").toBe(200);

      const updated = await updateResponse.json();
      expect(updated.id).toBe(createdId);
      expect(updated.userId).toBe(USER_ID);
      expect(updated.products).toEqual(updatedPayload.products);
      expect(updated.products[0].quantity).toBe(3);

      const deleteRoute = Routes.DELETE_CART.replace(
        "{id}",
        String(createdId),
      );
      const deleteResponse = await request.delete(
        `${BASE_URL}${deleteRoute}`,
      );
      expect(deleteResponse.status(), "Cart deletion should return 200").toBe(200);
      createdId = undefined;
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
});
