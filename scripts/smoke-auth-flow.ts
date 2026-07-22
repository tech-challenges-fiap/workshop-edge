export interface SmokeConfig {
  edgeBaseUrl: string;
  smokeCpf: string;
  protectedPath: string;
  skipAppProxy: boolean;
  servicePaths: string[];
}

export async function runSmokeAuthFlow(config = readSmokeConfig()): Promise<void> {
  const authResponse = await fetch(`${config.edgeBaseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      cpf: config.smokeCpf,
    }),
  });

  if (!authResponse.ok) {
    throw new Error(`auth smoke step failed with HTTP ${authResponse.status}`);
  }

  const authBody = (await authResponse.json()) as {
    access_token?: string;
    token_type?: string;
  };

  if (authBody.token_type !== "Bearer" || !authBody.access_token) {
    throw new Error("auth smoke step did not return a bearer token");
  }

  console.log("Auth smoke step passed: received Bearer token.");

  if (config.skipAppProxy) {
    console.log("Skipping app proxy smoke step (SMOKE_SKIP_APP_PROXY=true).");
  } else {
    await smokeAuthenticatedPath(config.edgeBaseUrl, config.protectedPath, authBody.access_token, "App proxy");
  }

  if (config.servicePaths.length === 0) {
    console.log("No Phase 4 service smoke paths configured (SMOKE_SERVICE_PATHS empty).");
    return;
  }

  for (const servicePath of config.servicePaths) {
    await smokeAuthenticatedPath(config.edgeBaseUrl, servicePath, authBody.access_token, "Service route");
  }
}

export function readSmokeConfig(env = process.env): SmokeConfig {
  return {
    edgeBaseUrl: requiredEnv("EDGE_BASE_URL", env).replace(/\/+$/, ""),
    smokeCpf: requiredEnv("SMOKE_CPF", env),
    protectedPath: normalizePath(env.SMOKE_PROTECTED_PATH ?? "/api/work-orders"),
    skipAppProxy: env.SMOKE_SKIP_APP_PROXY === "true",
    servicePaths: parseSmokeServicePaths(env.SMOKE_SERVICE_PATHS),
  };
}

export function parseSmokeServicePaths(value?: string): string[] {
  const trimmed = value?.trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as unknown;

    if (!Array.isArray(parsed) || parsed.some((entry) => typeof entry !== "string")) {
      throw new Error("SMOKE_SERVICE_PATHS JSON value must be an array of strings");
    }

    return normalizePathList(parsed);
  }

  return normalizePathList(trimmed.split(","));
}

function normalizePathList(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean).map(normalizePath);
}

function normalizePath(value: string): string {
  return value.startsWith("/") ? value : `/${value}`;
}

async function smokeAuthenticatedPath(
  edgeBaseUrl: string,
  path: string,
  accessToken: string,
  label: "App proxy" | "Service route",
): Promise<void> {
  const normalizedPath = normalizePath(path);
  const response = await fetch(`${edgeBaseUrl}${normalizedPath}`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`${label.toLowerCase()} smoke step failed for ${normalizedPath} with HTTP ${response.status}`);
  }

  console.log(`${label} smoke step passed for ${normalizedPath}.`);
}

function requiredEnv(name: string, env: Record<string, string | undefined>): string {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
}

if (import.meta.main) {
  await runSmokeAuthFlow();
}
