import assert from "node:assert/strict";
import test from "node:test";

import { hashToken } from "../lib/token.ts";

test("hashes session and magic-link tokens deterministically without storing plaintext", async () => {
  const first = await hashToken("a-private-token");
  const again = await hashToken("a-private-token");
  const different = await hashToken("another-private-token");

  assert.equal(first, again);
  assert.notEqual(first, different);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(first, /private-token/);
});
