import { describe, expect, test } from "bun:test";

import {
  buildClaims,
  handler,
  isCpfShapeValid,
  sanitizeCpf,
} from "../src/functions/auth-cpf.ts";

describe("sanitizeCpf", () => {
  test("removes punctuation", () => {
    expect(sanitizeCpf("123.456.789-00")).toBe("12345678900");
  });
});

describe("isCpfShapeValid", () => {
  test("accepts 11 digits", () => {
    expect(isCpfShapeValid("123.456.789-00")).toBe(true);
  });

  test("rejects invalid shapes", () => {
    expect(isCpfShapeValid("123")).toBe(false);
  });
});

describe("buildClaims", () => {
  test("returns the required claims", () => {
    const claims = buildClaims(
      {
        cpf: "123.456.789-00",
      },
      new Date("2026-01-01T00:00:00.000Z"),
    );

    expect(claims).toMatchObject({
      sub: "person:12345678900",
      person_id: "person:12345678900",
      cpf: "12345678900",
      role: "customer",
      status: "pending",
      iss: "workshop-edge",
      aud: "workshop-app",
      iat: 1767225600,
      exp: 1767226500,
      jti: "bootstrap-12345678900-1767225600",
    });
  });
});

describe("handler", () => {
  test("returns 400 for invalid cpf shape", async () => {
    const response = await handler({ cpf: "123" });

    expect(response.statusCode).toBe(400);
  });
});

