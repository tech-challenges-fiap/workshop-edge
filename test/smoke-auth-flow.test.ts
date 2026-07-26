import { afterEach, describe, expect, test } from "bun:test";
import { parseSmokeServicePaths, readSmokeConfig, runSmokeAuthFlow } from "../scripts/smoke-auth-flow";

const originalFetch = globalThis.fetch;
const originalConsoleLog = console.log;

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.log = originalConsoleLog;
});

describe("smoke auth flow config", () => {
  test("parses JSON service smoke paths and normalizes leading slashes", () => {
    expect(parseSmokeServicePaths('["os/work-orders", "/billing/invoices", ""]')).toEqual([
      "/os/work-orders",
      "/billing/invoices",
    ]);
  });

  test("parses comma-separated service smoke paths and ignores empty entries", () => {
    expect(parseSmokeServicePaths("os/work-orders, /execution/jobs, ")).toEqual([
      "/os/work-orders",
      "/execution/jobs",
    ]);
  });

  test("empty service smoke paths produce an empty list", () => {
    expect(parseSmokeServicePaths()).toEqual([]);
    expect(parseSmokeServicePaths("   ")).toEqual([]);
  });

  test("rejects JSON service smoke values that are not arrays of strings", () => {
    expect(() => parseSmokeServicePaths('{"path":"/os/work-orders"}')).toThrow(
      "SMOKE_SERVICE_PATHS JSON value must be an array of strings",
    );
    expect(() => parseSmokeServicePaths('["/os/work-orders", 123]')).toThrow(
      "SMOKE_SERVICE_PATHS JSON value must be an array of strings",
    );
  });

  test("reads smoke config without inventing service paths", () => {
    expect(
      readSmokeConfig({
        EDGE_BASE_URL: "https://edge.example/stag/",
        SMOKE_CPF: "12345678900",
      }),
    ).toEqual({
      edgeBaseUrl: "https://edge.example/stag",
      smokeCpf: "12345678900",
      protectedPath: "/api/work-orders",
      skipAppProxy: false,
      servicePaths: [],
    });
  });

  test("runs app and configured service path smokes with the auth token", async () => {
    const calls: Array<{ authorization?: string; url: string }> = [];
    const logs: string[] = [];

    console.log = (message?: unknown) => {
      logs.push(String(message));
    };

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const headers = new Headers(init?.headers);

      calls.push({
        authorization: headers.get("authorization") ?? undefined,
        url,
      });

      if (url.endsWith("/auth/login")) {
        return Response.json({
          access_token: "sensitive-token",
          token_type: "Bearer",
        });
      }

      return new Response(null, { status: 204 });
    }) as typeof fetch;

    await runSmokeAuthFlow({
      edgeBaseUrl: "https://edge.example/stag",
      protectedPath: "/api/work-orders",
      servicePaths: ["/os/work-orders", "/billing/invoices"],
      skipAppProxy: false,
      smokeCpf: "12345678900",
    });

    expect(calls).toEqual([
      { url: "https://edge.example/stag/auth/login", authorization: undefined },
      { url: "https://edge.example/stag/api/work-orders", authorization: "Bearer sensitive-token" },
      { url: "https://edge.example/stag/os/work-orders", authorization: "Bearer sensitive-token" },
      { url: "https://edge.example/stag/billing/invoices", authorization: "Bearer sensitive-token" },
    ]);
    expect(logs.join("\n")).not.toContain("sensitive-token");
    expect(logs.join("\n")).not.toContain("12345678900");
  });
});
