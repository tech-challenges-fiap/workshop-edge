type AuthCpfInput = {
  cpf: string;
  aud?: string;
  iss?: string;
  personId?: string;
  role?: string;
  status?: string;
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

export function sanitizeCpf(value: string): string {
  return value.replace(/\D/g, "");
}

export function isCpfShapeValid(value: string): boolean {
  return /^\d{11}$/.test(sanitizeCpf(value));
}

export function buildClaims(input: AuthCpfInput, now = new Date()): JwtClaims {
  const cpf = sanitizeCpf(input.cpf);
  const issuedAt = Math.floor(now.getTime() / 1000);

  return {
    sub: input.personId ?? `person:${cpf}`,
    person_id: input.personId ?? `person:${cpf}`,
    cpf,
    role: input.role ?? "customer",
    status: input.status ?? "pending",
    iss: input.iss ?? "workshop-edge",
    aud: input.aud ?? "workshop-app",
    exp: issuedAt + 900,
    iat: issuedAt,
    jti: `bootstrap-${cpf}-${issuedAt}`,
  };
}

export async function handler(event: AuthCpfInput) {
  if (!isCpfShapeValid(event.cpf)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "invalid cpf shape",
      }),
    };
  }

  return {
    statusCode: 202,
    body: JSON.stringify({
      message: "auth-cpf bootstrap placeholder",
      claims: buildClaims(event),
    }),
  };
}

