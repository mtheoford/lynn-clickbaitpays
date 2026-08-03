import assert from "node:assert/strict";
import test from "node:test";

import { checkoutReservationDecision } from "../lib/checkout-reservation.ts";

const now = new Date("2026-08-03T12:00:00.000Z");

test("protects active and retained tenant addresses, including from the same customer", () => {
  assert.equal(
    checkoutReservationDecision(
      { userId: "user-a", status: "active", reservationExpiresAt: null },
      "user-a",
      now,
    ),
    "retained",
  );
});

test("protects a live pending reservation from another customer", () => {
  assert.equal(
    checkoutReservationDecision(
      {
        userId: "user-a",
        status: "pending",
        reservationExpiresAt: new Date("2026-08-04T12:00:00.000Z"),
      },
      "user-b",
      now,
    ),
    "reserved",
  );
});

test("reuses an owner's live attempt and releases an expired reservation", () => {
  assert.equal(
    checkoutReservationDecision(
      {
        userId: "user-a",
        status: "pending",
        reservationExpiresAt: new Date("2026-08-04T12:00:00.000Z"),
      },
      "user-a",
      now,
    ),
    "reuse",
  );
  assert.equal(
    checkoutReservationDecision(
      {
        userId: "user-a",
        status: "pending",
        reservationExpiresAt: new Date("2026-08-03T11:59:59.000Z"),
      },
      "user-b",
      now,
    ),
    "replace",
  );
});
