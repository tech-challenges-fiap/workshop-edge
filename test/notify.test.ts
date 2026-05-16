import { expect, test } from "bun:test";

import { handler, notify } from "../src/functions/notify.ts";

test("notify handler accepts normalized channel input", async () => {
  const response = await handler({
    channel: "email",
    destination: "user@example.com",
    message: "hello",
  });

  expect(response.statusCode).toBe(202);
  expect(JSON.parse(response.body)).toMatchObject({
    accepted: true,
    deliveries: [
      {
        channel: "email",
        destination: "user@example.com",
      },
    ],
  });
});

test("notify accepts app notification payloads", async () => {
  const sent: unknown[] = [];
  const response = await notify(
    {
      email: "user@example.com",
      phone: "+5511999999999",
      message: "vehicle ready",
    },
    {
      sender: {
        async send(delivery, context) {
          sent.push({ delivery, context });
        },
      },
    },
  );

  expect(response.statusCode).toBe(202);
  expect(sent).toHaveLength(2);
});

test("notify rejects payloads without destinations", async () => {
  const response = await notify({
    message: "hello",
  });

  expect(response.statusCode).toBe(400);
});

test("notify preserves request id from API Gateway events", async () => {
  const contexts: unknown[] = [];
  const response = await notify(
    {
      body: JSON.stringify({
        channel: "sms",
        destination: "+5511999999999",
        message: "hello",
      }),
      headers: {
        "x-request-id": "req-123",
      },
      requestContext: {
        requestId: "gateway-req",
        http: {
          method: "POST",
        },
      },
    },
    {
      sender: {
        async send(_delivery, context) {
          contexts.push(context);
        },
      },
    },
  );

  expect(response.statusCode).toBe(202);
  expect(contexts).toEqual([{ requestId: "req-123" }]);
});

test("notify maps provider failures to 502", async () => {
  const response = await notify(
    {
      channel: "email",
      destination: "user@example.com",
      message: "hello",
    },
    {
      sender: {
        async send() {
          throw new Error("provider down");
        },
      },
    },
  );

  expect(response.statusCode).toBe(502);
});
