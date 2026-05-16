type Headers = Record<string, string | undefined>;

type ApiGatewayHttpEvent = {
  body?: string | null;
  headers?: Headers;
  isBase64Encoded?: boolean;
  requestContext?: {
    requestId?: string;
    http?: {
      method?: string;
    };
  };
  httpMethod?: string;
};

type NormalizedNotificationInput = {
  channel: "email" | "sms";
  destination: string;
  message: string;
};

type AppNotificationInput = {
  email?: string;
  phone?: string;
  message: string;
};

type NotificationInput = NormalizedNotificationInput | AppNotificationInput;

type NotificationDelivery = {
  channel: "email" | "sms";
  destination: string;
  message: string;
};

type LambdaResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

type NotifyDependencies = {
  sender?: NotificationSender;
};

type NotificationSender = {
  send(delivery: NotificationDelivery, context: NotificationContext): Promise<void>;
};

type NotificationContext = {
  requestId?: string;
};

class NotifyHttpError extends Error {
  public constructor(
    public readonly statusCode: number,
    public readonly error: string,
    message: string,
  ) {
    super(message);
    this.name = "NotifyHttpError";
  }
}

export async function handler(
  event: ApiGatewayHttpEvent | NotificationInput,
): Promise<LambdaResponse> {
  return notify(event);
}

export async function notify(
  event: ApiGatewayHttpEvent | NotificationInput,
  dependencies: NotifyDependencies = {},
): Promise<LambdaResponse> {
  try {
    const context = readContext(event);
    const deliveries = normalizeNotificationInput(parseNotificationInput(event));
    const sender = dependencies.sender ?? createWebhookNotificationSender();

    for (const delivery of deliveries) {
      await sender.send(delivery, context);
    }

    return jsonResponse(202, {
      message: "notification accepted",
      accepted: true,
      deliveries: deliveries.map((delivery) => ({
        channel: delivery.channel,
        destination: delivery.destination,
      })),
    });
  } catch (error) {
    if (error instanceof NotifyHttpError) {
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
      return jsonResponse(502, {
        error: "NotificationDeliveryFailed",
        message: error.message,
      });
    }

    return jsonResponse(500, {
      error: "UnknownError",
      message: "unknown notification failure",
    });
  }
}

function parseNotificationInput(event: ApiGatewayHttpEvent | NotificationInput): NotificationInput {
  if (!isApiGatewayHttpEvent(event)) {
    return event;
  }

  const method = event.requestContext?.http?.method ?? event.httpMethod ?? "POST";

  if (method.toUpperCase() !== "POST") {
    throw new NotifyHttpError(405, "MethodNotAllowed", "notify only accepts POST requests");
  }

  const rawBody = event.body
    ? event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body
    : "{}";

  return JSON.parse(rawBody) as NotificationInput;
}

function normalizeNotificationInput(input: NotificationInput): NotificationDelivery[] {
  if (!input || typeof input !== "object") {
    throw new NotifyHttpError(400, "ValidationError", "notification payload is required");
  }

  if (!("message" in input) || typeof input.message !== "string" || input.message.trim().length === 0) {
    throw new NotifyHttpError(400, "ValidationError", "message is required");
  }

  if ("channel" in input) {
    if (input.channel !== "email" && input.channel !== "sms") {
      throw new NotifyHttpError(400, "ValidationError", "channel must be email or sms");
    }

    if (typeof input.destination !== "string" || input.destination.trim().length === 0) {
      throw new NotifyHttpError(400, "ValidationError", "destination is required");
    }

    return [
      {
        channel: input.channel,
        destination: input.destination.trim(),
        message: input.message,
      },
    ];
  }

  const deliveries: NotificationDelivery[] = [];

  if (typeof input.email === "string" && input.email.trim().length > 0) {
    deliveries.push({
      channel: "email",
      destination: input.email.trim(),
      message: input.message,
    });
  }

  if (typeof input.phone === "string" && input.phone.trim().length > 0) {
    deliveries.push({
      channel: "sms",
      destination: input.phone.trim(),
      message: input.message,
    });
  }

  if (deliveries.length === 0) {
    throw new NotifyHttpError(400, "ValidationError", "email or phone is required");
  }

  return deliveries;
}

function createWebhookNotificationSender(): NotificationSender {
  const endpointUrl = process.env.NOTIFICATION_WEBHOOK_URL?.trim();

  if (!endpointUrl) {
    return {
      async send(): Promise<void> {
        return Promise.resolve();
      },
    };
  }

  return {
    async send(delivery: NotificationDelivery, context: NotificationContext): Promise<void> {
      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(context.requestId ? { "x-request-id": context.requestId } : {}),
        },
        body: JSON.stringify({
          channel: delivery.channel,
          destination: delivery.destination,
          message: delivery.message,
        }),
      });

      if (!response.ok) {
        throw new Error(`notification provider returned HTTP ${response.status}`);
      }
    },
  };
}

function readContext(event: ApiGatewayHttpEvent | NotificationInput): NotificationContext {
  if (!isApiGatewayHttpEvent(event)) {
    return {};
  }

  return {
    requestId:
      headerValue(event.headers, "x-request-id") ??
      event.requestContext?.requestId,
  };
}

function isApiGatewayHttpEvent(value: ApiGatewayHttpEvent | NotificationInput): value is ApiGatewayHttpEvent {
  return "requestContext" in value || "body" in value || "httpMethod" in value;
}

function headerValue(headers: Headers | undefined, name: string): string | undefined {
  if (!headers) {
    return undefined;
  }

  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase());
  return match?.[1];
}

function jsonResponse(statusCode: number, body: Record<string, unknown>): LambdaResponse {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  };
}
