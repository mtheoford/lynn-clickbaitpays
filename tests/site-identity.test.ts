import assert from "node:assert/strict";
import test from "node:test";

import { resolveSiteIdentity } from "../lib/site-identity.ts";

test("uses a structured personal name when no company is supplied", () => {
  const result = resolveSiteIdentity({
    firstName: "  Taylor ",
    lastName: " Customer  ",
    displayNameType: "personal",
  });

  assert.equal(result.error, null);
  assert.deepEqual(result.identity, {
    firstName: "Taylor",
    lastName: "Customer",
    fullName: "Taylor Customer",
    companyName: null,
    displayNameType: "personal",
    displayName: "Taylor Customer",
    initials: "TC",
  });
});

test("uses the optional company only after an explicit business selection", () => {
  const result = resolveSiteIdentity({
    firstName: "Taylor",
    lastName: "Customer",
    companyName: "Customer Growth LLC",
    displayNameType: "business",
  });

  assert.equal(result.error, null);
  assert.equal(result.identity?.fullName, "Taylor Customer");
  assert.equal(result.identity?.displayName, "Customer Growth LLC");
  assert.equal(result.identity?.displayNameType, "business");
  assert.equal(result.identity?.initials, "CG");
});

test("requires a display choice when a company is supplied", () => {
  const result = resolveSiteIdentity({
    firstName: "Taylor",
    lastName: "Customer",
    companyName: "Customer Growth LLC",
  });

  assert.match(result.error ?? "", /Choose whether/);
  assert.equal(result.identity, null);
});

test("does not allow a business selection without a company", () => {
  const result = resolveSiteIdentity({
    firstName: "Taylor",
    lastName: "Customer",
    companyName: "",
    displayNameType: "business",
  });

  assert.equal(result.error, null);
  assert.equal(result.identity?.displayNameType, "personal");
  assert.equal(result.identity?.displayName, "Taylor Customer");
});
