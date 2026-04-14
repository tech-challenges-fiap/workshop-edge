import { expect, test } from "bun:test";

import { handler } from "../src/functions/notify.ts";

test("notify handler accepts valid input", async () => {
  const response = await handler({
    channel: "email",
    destination: "user@example.com",
    message: "hello",
  });

  expect(response.statusCode).toBe(202);
  expect(JSON.parse(response.body)).toMatchObject({
    accepted: true,
    channel: "email",
  });
});

