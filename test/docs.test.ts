import { describe, expect, test } from "bun:test";
import { handler } from "../src/functions/docs.ts";

function makeEvent(path: string, method = "GET", stage = "stag") {
  return {
    rawPath: `/${stage}${path}`,
    requestContext: { stage, http: { method } },
  };
}

describe("docs handler", () => {
  test("GET /docs returns 200 HTML with Swagger UI", async () => {
    const res = await handler(makeEvent("/docs"));
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.body).toContain("swagger-ui");
    expect(res.body).toContain("openapi.yaml");
  });

  test("GET /openapi.yaml returns 200 with YAML content", async () => {
    const res = await handler(makeEvent("/openapi.yaml"));
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("application/yaml");
    expect(res.body).toContain("openapi:");
    expect(res.body).toContain("/auth/login");
  });

  test("GET /openapi.yaml strips stage prefix correctly", async () => {
    const res = await handler(makeEvent("/openapi.yaml", "GET", "prod"));
    expect(res.statusCode).toBe(200);
  });

  test("unknown path returns 404", async () => {
    const res = await handler(makeEvent("/unknown"));
    expect(res.statusCode).toBe(404);
  });

  test("non-GET method returns 405", async () => {
    const res = await handler(makeEvent("/docs", "POST"));
    expect(res.statusCode).toBe(405);
  });
});
