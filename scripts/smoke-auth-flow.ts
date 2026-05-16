const edgeBaseUrl = requiredEnv("EDGE_BASE_URL").replace(/\/+$/, "");
const smokeCpf = requiredEnv("SMOKE_CPF");
const protectedPath = process.env.SMOKE_PROTECTED_PATH ?? "/api/work-orders";

const authResponse = await fetch(`${edgeBaseUrl}/auth/login`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    cpf: smokeCpf,
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

const appResponse = await fetch(`${edgeBaseUrl}${withLeadingSlash(protectedPath)}`, {
  headers: {
    authorization: `Bearer ${authBody.access_token}`,
  },
});

if (!appResponse.ok) {
  throw new Error(`protected app smoke step failed with HTTP ${appResponse.status}`);
}

console.log(`Smoke auth flow passed for ${withLeadingSlash(protectedPath)}.`);

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
}

function withLeadingSlash(value: string): string {
  return value.startsWith("/") ? value : `/${value}`;
}
