import assert from "node:assert/strict";
import test from "node:test";

import {
  MAGIC_LINK_SUCCESS_MESSAGE,
  MAGIC_LINK_SUCCESS_MESSAGE_FR,
  submitMagicLinkRequest,
} from "../app/manage/sign-in/magic-link-submission.ts";
import {
  completeCustomerMagicLinkSignIn,
  customerAuthLocale,
  customerManagePath,
  customerSignInErrorMessage,
  inspectCustomerMagicLink,
  INVALID_MAGIC_LINK_MESSAGE,
  INVALID_MAGIC_LINK_MESSAGE_FR,
} from "../lib/magic-link-flow.ts";

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
  assert.deepEqual(JSON.parse(requestedBody), {
    email: "customer@example.com",
    locale: "en",
  });
  assert.equal(resetCount, 1);
  assert.equal(message, MAGIC_LINK_SUCCESS_MESSAGE);
});

test("a French request preserves its locale and returns a French status", async () => {
  let requestedBody = "";

  const message = await submitMagicLinkRequest(
    "client@example.fr",
    { reset: () => {} },
    async (_url, init) => {
      requestedBody = String(init.body);
      return { ok: true };
    },
    "fr",
  );

  assert.deepEqual(JSON.parse(requestedBody), {
    email: "client@example.fr",
    locale: "fr",
  });
  assert.equal(message, MAGIC_LINK_SUCCESS_MESSAGE_FR);
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

test("an email scanner can inspect a link without consuming it", async () => {
  const token = "scanner-safe-token-that-is-long-enough";
  let consumeCount = 0;

  const isValid = await inspectCustomerMagicLink(token, async () => true);

  assert.equal(isValid, true);
  assert.equal(consumeCount, 0);

  const authenticated = await completeCustomerMagicLinkSignIn(token, {
    consume: async () => {
      consumeCount += 1;
      return {
        sessionToken: "session-token",
        expiresAt: new Date("2026-10-01T00:00:00.000Z"),
        userId: "user-1",
      };
    },
    setSessionCookie: async () => {},
    recordAuthenticated: async () => {},
  });

  assert.equal(authenticated, true);
  assert.equal(consumeCount, 1);
});

test("explicit confirmation establishes the session and records authentication", async () => {
  const expiresAt = new Date("2026-10-01T00:00:00.000Z");
  let cookie: { sessionToken: string; expiresAt: Date } | null = null;
  let authenticatedUserId = "";

  const authenticated = await completeCustomerMagicLinkSignIn("valid-token", {
    consume: async () => ({
      sessionToken: "session-token",
      expiresAt,
      userId: "user-1",
    }),
    setSessionCookie: async (sessionToken, cookieExpiresAt) => {
      cookie = { sessionToken, expiresAt: cookieExpiresAt };
    },
    recordAuthenticated: async (userId) => {
      authenticatedUserId = userId;
    },
  });

  assert.equal(authenticated, true);
  assert.deepEqual(cookie, { sessionToken: "session-token", expiresAt });
  assert.equal(authenticatedUserId, "user-1");
});

test("a rejected confirmation does not set a session", async () => {
  let cookieSet = false;
  let authenticationRecorded = false;

  const authenticated = await completeCustomerMagicLinkSignIn("used-token", {
    consume: async () => null,
    setSessionCookie: async () => { cookieSet = true; },
    recordAuthenticated: async () => { authenticationRecorded = true; },
  });

  assert.equal(authenticated, false);
  assert.equal(cookieSet, false);
  assert.equal(authenticationRecorded, false);
});

test("invalid links receive a clear customer-facing explanation", () => {
  assert.equal(customerSignInErrorMessage("invalid-link"), INVALID_MAGIC_LINK_MESSAGE);
  assert.equal(customerSignInErrorMessage(["invalid-link"]), INVALID_MAGIC_LINK_MESSAGE);
  assert.equal(
    customerSignInErrorMessage("invalid-link", "fr"),
    INVALID_MAGIC_LINK_MESSAGE_FR,
  );
  assert.equal(customerSignInErrorMessage("unknown-error"), null);
  assert.equal(customerSignInErrorMessage(undefined), null);
});

test("customer auth locale and route helpers default safely to English", () => {
  assert.equal(customerAuthLocale("fr"), "fr");
  assert.equal(customerAuthLocale(["fr", "en"]), "fr");
  assert.equal(customerAuthLocale("de"), "en");
  assert.equal(customerAuthLocale(undefined), "en");
  assert.equal(customerManagePath("en"), "/manage");
  assert.equal(customerManagePath("fr"), "/fr/manage");
  assert.equal(customerManagePath("fr", "sign-in"), "/fr/manage/sign-in");
  assert.equal(customerManagePath("en", "/confirm"), "/manage/confirm");
});
