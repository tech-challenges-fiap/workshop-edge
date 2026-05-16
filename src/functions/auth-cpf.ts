import { createHmac, randomUUID } from "node:crypto";

type Headers = Record<string, string | undefined>;

type ApiGatewayHttpEvent = {
  version?: string;
  rawPath?: string;
  body?: string | null;
  headers?: Headers;
  isBase64Encoded?: boolean;
  requestContext?: {
    requestId?: string;
    stage?: string;
    http?: {
      method?: string;
      path?: string;
    };
  };
  httpMethod?: string;
  path?: string;
};

type AuthCpfLoginInput = {
  cpf: string;
};

type JwtClaims = {
  sub: string;
  person_id: string;
  cpf: string;
  role: string;
  status: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  jti: string;
};

type PersonAuthRecord = {
  id: number | string;
  document: string;
  role: string;
  status: string;
};

type PersonRepository = {
  findByCpf(cpf: string): Promise<PersonAuthRecord | null>;
};

type LambdaResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

type AuthCpfDependencies = {
  personRepository?: PersonRepository;
  jwtSecretProvider?: () => Promise<string>;
  now?: () => Date;
};

type DbConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: {
    rejectUnauthorized: boolean;
  };
};

type PgClient = {
  connect(): Promise<void>;
  query<T>(sql: string, params: unknown[]): Promise<{ rows: T[] }>;
  end(): Promise<void>;
};

type PgClientModule = {
  Client: new (config: DbConfig) => PgClient;
};

type SecretsManagerModule = {
  SecretsManagerClient: new (config: { region?: string }) => {
    send(command: unknown): Promise<{ SecretString?: string; SecretBinary?: Uint8Array }>;
  };
  GetSecretValueCommand: new (input: { SecretId: string }) => unknown;
};

class HttpError extends Error {
  public constructor(
    public readonly statusCode: number,
    public readonly error: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function sanitizeCpf(value: string): string {
  return value.replace(/\D/g, "");
}

export function isCpfShapeValid(value: string): boolean {
  return /^\d{11}$/.test(sanitizeCpf(value));
}

export function buildClaims(
  input: {
    cpf: string;
    personId: string;
    role: string;
    status: string;
    iss?: string;
    aud?: string;
    jti?: string;
  },
  now = new Date(),
  expiresInSeconds = Number(process.env.JWT_EXPIRES_SECONDS) || 900,
): JwtClaims {
  const issuedAt = Math.floor(now.getTime() / 1000);

  return {
    sub: input.personId,
    person_id: input.personId,
    cpf: sanitizeCpf(input.cpf),
    role: input.role,
    status: input.status,
    iss: input.iss ?? process.env.JWT_ISSUER ?? "workshop-edge",
    aud: input.aud ?? process.env.JWT_AUDIENCE ?? "workshop-app",
    exp: issuedAt + expiresInSeconds,
    iat: issuedAt,
    jti: input.jti ?? randomUUID(),
  };
}

export function signJwt(claims: JwtClaims, secret: string): string {
  if (!secret || secret.trim().length === 0) {
    throw new Error("JWT signing secret is not configured");
  }

  const encodedHeader = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", secret).update(signingInput).digest();

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

export async function handler(event: ApiGatewayHttpEvent | AuthCpfLoginInput): Promise<LambdaResponse> {
  return authenticateCpf(event);
}

export async function authenticateCpf(
  event: ApiGatewayHttpEvent | AuthCpfLoginInput,
  dependencies: AuthCpfDependencies = {},
): Promise<LambdaResponse> {
  try {
    const input = parseLoginInput(event);

    if (!isCpfShapeValid(input.cpf)) {
      throw new HttpError(400, "ValidationError", "invalid cpf shape");
    }

    const cpf = sanitizeCpf(input.cpf);
    const repository = dependencies.personRepository ?? createPostgresPersonRepository();
    const person = await repository.findByCpf(cpf);

    if (!person) {
      throw new HttpError(401, "Unauthorized", "invalid cpf credentials");
    }

    if (person.status !== "active") {
      throw new HttpError(403, "Forbidden", "person is not active");
    }

    const jwtSecretProvider = dependencies.jwtSecretProvider ?? loadJwtSecret;
    const claims = buildClaims(
      {
        cpf,
        personId: String(person.id),
        role: person.role,
        status: person.status,
      },
      dependencies.now?.() ?? new Date(),
    );
    const accessToken = signJwt(claims, await jwtSecretProvider());

    return jsonResponse(200, {
      token_type: "Bearer",
      access_token: accessToken,
      expires_in: claims.exp - claims.iat,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(error.statusCode, {
        error: error.error,
        message: error.message,
      });
    }

    if (error instanceof SyntaxError) {
      return jsonResponse(400, {
        error: "ValidationError",
        message: "request body must be valid JSON",
      });
    }

    if (error instanceof Error) {
      return jsonResponse(500, {
        error: "UnexpectedError",
        message: error.message,
      });
    }

    return jsonResponse(500, {
      error: "UnknownError",
      message: "unknown authentication failure",
    });
  }
}

function parseLoginInput(event: ApiGatewayHttpEvent | AuthCpfLoginInput): AuthCpfLoginInput {
  if (!isApiGatewayHttpEvent(event)) {
    return event;
  }

  const method = event.requestContext?.http?.method ?? event.httpMethod ?? "POST";

  if (method.toUpperCase() !== "POST") {
    throw new HttpError(405, "MethodNotAllowed", "auth-cpf only accepts POST requests");
  }

  const rawPath = event.rawPath ?? event.requestContext?.http?.path ?? event.path;
  const stage = event.requestContext?.stage;
  const path = stage && rawPath?.startsWith(`/${stage}/`)
    ? rawPath.slice(stage.length + 1)
    : rawPath;

  if (path !== "/auth/login") {
    throw new HttpError(404, "NotFound", "auth route not found");
  }

  const rawBody = event.body
    ? event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body
    : "{}";
  const parsed = JSON.parse(rawBody) as Partial<AuthCpfLoginInput>;

  if (typeof parsed.cpf !== "string" || parsed.cpf.trim().length === 0) {
    throw new HttpError(400, "ValidationError", "cpf is required");
  }

  return {
    cpf: parsed.cpf,
  };
}

function isApiGatewayHttpEvent(value: ApiGatewayHttpEvent | AuthCpfLoginInput): value is ApiGatewayHttpEvent {
  return "requestContext" in value || "rawPath" in value || "body" in value || "httpMethod" in value;
}

function jsonResponse(statusCode: number, body: Record<string, unknown>): LambdaResponse {
  return {
    statusCode,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function createPostgresPersonRepository(): PersonRepository {
  return {
    async findByCpf(cpf: string): Promise<PersonAuthRecord | null> {
      const { Client } = (await import("pg")) as unknown as PgClientModule;
      const client = new Client(await loadDatabaseConfig());

      try {
        await client.connect();

        const result = await client.query<{
          id: number | string;
          document: string;
          role: string;
          status: string;
        }>(
          `
            select id, document, role, status
            from person
            where regexp_replace(document, '\\D', '', 'g') = $1
            limit 1
          `,
          [cpf],
        );

        return result.rows[0] ?? null;
      } finally {
        await client.end();
      }
    },
  };
}

async function loadDatabaseConfig(): Promise<DbConfig> {
  const secret = process.env.DB_SECRET_ARN
    ? await loadSecretObject(process.env.DB_SECRET_ARN)
    : {};

  const host = envString("DB_HOST") ?? secretString(secret, "host");
  const port = Number(envString("DB_PORT") ?? secretString(secret, "port") ?? "5432");
  const database =
    envString("DB_NAME") ?? secretString(secret, "dbname") ?? secretString(secret, "database");
  const user = envString("DB_USER") ?? secretString(secret, "username") ?? secretString(secret, "user");
  const password = envString("DB_PASSWORD") ?? secretString(secret, "password");

  if (!host || !database || !user || !password || !Number.isFinite(port)) {
    throw new Error("Database connection configuration is incomplete");
  }

  const sslEnabled = envString("DB_SSL") !== "false";

  return {
    host,
    port,
    database,
    user,
    password,
    ssl: sslEnabled
      ? {
          rejectUnauthorized: envString("DB_SSL_REJECT_UNAUTHORIZED") === "true",
        }
      : undefined,
  };
}

async function loadJwtSecret(): Promise<string> {
  const directSecret = envString("JWT_SECRET");

  if (directSecret) {
    return directSecret;
  }

  const secretArn = envString("JWT_SECRET_ARN");

  if (!secretArn) {
    throw new Error("JWT_SECRET or JWT_SECRET_ARN must be configured");
  }

  const secret = await loadSecretObject(secretArn);
  const secretValue =
    secretString(secret, "jwt_secret") ??
    secretString(secret, "JWT_SECRET") ??
    secretString(secret, "secret") ??
    secretString(secret, "value");

  if (!secretValue) {
    throw new Error("JWT secret value is missing from Secrets Manager payload");
  }

  return secretValue;
}

async function loadSecretObject(secretId: string): Promise<Record<string, unknown>> {
  const secretString = await loadSecretString(secretId);

  try {
    const parsed = JSON.parse(secretString) as unknown;
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {
      value: secretString,
    };
  }
}

async function loadSecretString(secretId: string): Promise<string> {
  const { SecretsManagerClient, GetSecretValueCommand } = (await import(
    "@aws-sdk/client-secrets-manager"
  )) as unknown as SecretsManagerModule;
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));

  if (response.SecretString) {
    return response.SecretString;
  }

  if (response.SecretBinary) {
    return Buffer.from(response.SecretBinary).toString("utf8");
  }

  throw new Error("Secrets Manager returned an empty secret");
}

function envString(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function secretString(secret: Record<string, unknown>, name: string): string | undefined {
  const value = secret[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
