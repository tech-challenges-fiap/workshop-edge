import { createHmac } from "node:crypto";
import { describe, expect, test } from "bun:test";

import {
  authenticateCpf,
  buildClaims,
  handler,
  isCpfShapeValid,
  sanitizeCpf,
  signJwt,
} from "../src/functions/auth-cpf.ts";

const activePersonRepository = {
  async findByCpf() {
    return {
      id: 123,
      document: "123.456.789-00",
      role: "front-desk",
      status: "active",
    };
  },
};

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
  test("returns the app-required claims", () => {
    const claims = buildClaims(
      {
        cpf: "123.456.789-00",
        personId: "123",
        role: "front-desk",
        status: "active",
        jti: "jwt-id",
      },
      new Date("2026-01-01T00:00:00.000Z"),
      900,
    );

    expect(claims).toEqual({
      sub: "123",
      person_id: "123",
      cpf: "12345678900",
      role: "front-desk",
      status: "active",
      iss: "workshop-edge",
      aud: "workshop-app",
      iat: 1767225600,
      exp: 1767226500,
      jti: "jwt-id",
    });
  });
});

describe("signJwt", () => {
  test("creates an HS256 JWT signature compatible with workshop-app expectations", () => {
    const token = signJwt(
      {
        sub: "123",
        person_id: "123",
        cpf: "12345678900",
        role: "front-desk",
        status: "active",
        iss: "workshop-edge",
        aud: "workshop-app",
        iat: 1767225600,
        exp: 1767226500,
        jti: "jwt-id",
      },
      "test-secret",
    );
    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
    const expectedSignature = createHmac("sha256", "test-secret")
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");

    expect(JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8"))).toMatchObject({
      alg: "HS256",
      typ: "JWT",
    });
    expect(JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"))).toMatchObject({
      aud: "workshop-app",
      iss: "workshop-edge",
      status: "active",
    });
    expect(encodedSignature).toBe(expectedSignature);
  });
});

describe("handler", () => {
  test("returns 400 for invalid cpf shape", async () => {
    const response = await handler({ cpf: "123" });

    expect(response.statusCode).toBe(400);
  });
});

describe("authenticateCpf", () => {
  test("returns a bearer token for an active person", async () => {
    const response = await authenticateCpf(
      { cpf: "123.456.789-00" },
      {
        personRepository: activePersonRepository,
        jwtSecretProvider: async () => "test-secret",
        now: () => new Date("2026-01-01T00:00:00.000Z"),
      },
    );
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(body.token_type).toBe("Bearer");
    expect(body.expires_in).toBe(900);
    expect(body.access_token).toContain(".");
  });

  test("returns 401 when the CPF does not belong to a person", async () => {
    const response = await authenticateCpf(
      { cpf: "123.456.789-00" },
      {
        personRepository: {
          async findByCpf() {
            return null;
          },
        },
        jwtSecretProvider: async () => "test-secret",
      },
    );

    expect(response.statusCode).toBe(401);
    expect(response.body).not.toContain("12345678900");
  });

  test("returns 403 when the person is inactive", async () => {
    const response = await authenticateCpf(
      { cpf: "123.456.789-00" },
      {
        personRepository: {
          async findByCpf() {
            return {
              id: 123,
              document: "123.456.789-00",
              role: "customer",
              status: "blocked",
            };
          },
        },
        jwtSecretProvider: async () => "test-secret",
      },
    );

    expect(response.statusCode).toBe(403);
  });

  test("parses API Gateway HTTP API events", async () => {
    const response = await authenticateCpf(
      {
        rawPath: "/auth/login",
        body: JSON.stringify({ cpf: "123.456.789-00" }),
        requestContext: {
          http: {
            method: "POST",
            path: "/auth/login",
          },
        },
      },
      {
        personRepository: activePersonRepository,
        jwtSecretProvider: async () => "test-secret",
      },
    );

    expect(response.statusCode).toBe(200);
  });

  test("rejects proxy paths that only end with login", async () => {
    const response = await authenticateCpf(
      {
        rawPath: "/auth/foo/login",
        body: JSON.stringify({ cpf: "123.456.789-00" }),
        requestContext: {
          http: {
            method: "POST",
            path: "/auth/foo/login",
          },
        },
      },
      {
        personRepository: activePersonRepository,
        jwtSecretProvider: async () => "test-secret",
      },
    );

    expect(response.statusCode).toBe(404);
    expect(response.body).not.toContain("access_token");
  });
});
