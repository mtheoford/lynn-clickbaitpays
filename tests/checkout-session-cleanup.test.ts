import assert from "node:assert/strict";
import test from "node:test";

import { prepareCheckoutSessionForReservationCleanup } from "../lib/checkout-session-cleanup.ts";
import type { CheckoutSessionCleanupApi } from "../lib/checkout-session-cleanup.ts";

function sessionApi(status: string | null) {
  const expired: string[] = [];
  const api: CheckoutSessionCleanupApi = {
    async retrieve(sessionId) {
      return { id: sessionId, status };
    },
    async expire(sessionId) {
      expired.push(sessionId);
    },
  };
  return { api, expired };
}

test("retains completed checkout sessions", async () => {
  const { api, expired } = sessionApi("complete");

  assert.equal(
    await prepareCheckoutSessionForReservationCleanup("cs_complete", api),
    "retain",
  );
  assert.deepEqual(expired, []);
});

test("expires open checkout sessions before allowing reservation deletion", async () => {
  const { api, expired } = sessionApi("open");

  assert.equal(
    await prepareCheckoutSessionForReservationCleanup("cs_open", api),
    "delete",
  );
  assert.deepEqual(expired, ["cs_open"]);
});

test("allows deletion after Stripe already marks a checkout expired", async () => {
  const { api, expired } = sessionApi("expired");

  assert.equal(
    await prepareCheckoutSessionForReservationCleanup("cs_expired", api),
    "delete",
  );
  assert.deepEqual(expired, []);
});

test("fails closed for an unknown checkout session status", async () => {
  const { api, expired } = sessionApi(null);

  assert.equal(
    await prepareCheckoutSessionForReservationCleanup("cs_unknown", api),
    "retain",
  );
  assert.deepEqual(expired, []);
});

test("does not allow deletion when Stripe expiration fails", async () => {
  const api: CheckoutSessionCleanupApi = {
    async retrieve(sessionId) {
      return { id: sessionId, status: "open" };
    },
    async expire() {
      throw new Error("Stripe unavailable");
    },
  };

  await assert.rejects(
    prepareCheckoutSessionForReservationCleanup("cs_open", api),
    /Stripe unavailable/,
  );
});
