import assert from "node:assert/strict";
import test from "node:test";

import {
  MAGIC_LINK_SUCCESS_MESSAGE,
  submitMagicLinkRequest,
} from "../app/manage/sign-in/magic-link-submission.ts";

test("submits the email, resets the captured form, and returns the success message", async () => {
  let resetCount = 0;
  let requestedUrl = "";
  let requestedBody = "";

  const message = await submitMagicLinkRequest(
    "customer@example.com",
    { reset: () => { resetCount += 1; } },
    async (url, init) => {
      requestedUrl = url;
      requestedBody = String(init.body);
      return { ok: true };
    },
  );

  assert.equal(requestedUrl, "/api/auth/magic-link");
  assert.deepEqual(JSON.parse(requestedBody), { email: "customer@example.com" });
  assert.equal(resetCount, 1);
  assert.equal(message, MAGIC_LINK_SUCCESS_MESSAGE);
});

test("a reset failure cannot replace the successful request message", async () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    const message = await submitMagicLinkRequest(
      "customer@example.com",
      { reset: () => { throw new Error("reset failed"); } },
      async () => ({ ok: true }),
    );
    assert.equal(message, MAGIC_LINK_SUCCESS_MESSAGE);
  } finally {
    console.error = originalConsoleError;
  }
});

test("a failed email request does not reset the form", async () => {
  let resetCount = 0;
  await assert.rejects(
    submitMagicLinkRequest(
      "customer@example.com",
      { reset: () => { resetCount += 1; } },
      async () => ({ ok: false }),
    ),
    /Sign-in email could not be sent/,
  );
  assert.equal(resetCount, 0);
});
