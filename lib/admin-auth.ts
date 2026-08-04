import { createRemoteJWKSet, jwtVerify } from "jose";
import { headers } from "next/headers";
import { getChatGPTUser, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { runtimeValue } from "@/lib/runtime";

export type AdminIdentity = {
  displayName: string;
  email: string;
  fullName: string | null;
};

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

type AdminAuthDiagnostic = Record<string, boolean | number | string>;

function reportAdminAuthFailure(diagnostic: AdminAuthDiagnostic) {
  console.error(JSON.stringify(diagnostic));
}

function jwtErrorMetadata(error: unknown) {
  if (!error || typeof error !== "object") {
    return { errorName: "UnknownError" };
  }

  const candidate = error as {
    name?: unknown;
    code?: unknown;
    claim?: unknown;
    reason?: unknown;
  };

  return {
    errorName: typeof candidate.name === "string" ? candidate.name : "UnknownError",
    ...(typeof candidate.code === "string" ? { errorCode: candidate.code } : {}),
    ...(typeof candidate.claim === "string" ? { claim: candidate.claim } : {}),
    ...(typeof candidate.reason === "string" ? { reason: candidate.reason } : {}),
  };
}

async function adminEmails(): Promise<Set<string>> {
  const configured = await runtimeValue("ADMIN_EMAILS");
  return new Set(
    configured
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function getCloudflareAccessUser(): Promise<AdminIdentity | null> {
  const [audience, teamDomain] = await Promise.all([
    runtimeValue("CF_ACCESS_AUD"),
    runtimeValue("CF_ACCESS_TEAM_DOMAIN"),
  ]);
  if (!audience || !teamDomain) {
    reportAdminAuthFailure(
      {
        message: "Cloudflare Access authentication failed",
        stage: "configuration",
        audienceConfigured: Boolean(audience),
        teamDomainConfigured: Boolean(teamDomain),
      },
    );
    return null;
  }

  const assertion = (await headers()).get("cf-access-jwt-assertion");
  if (!assertion) {
    reportAdminAuthFailure(
      {
        message: "Cloudflare Access authentication failed",
        stage: "assertion_header",
        assertionHeaderPresent: false,
      },
    );
    return null;
  }
  const normalizedDomain = teamDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const certsUrl = `https://${normalizedDomain}/cdn-cgi/access/certs`;
  let jwks = jwksCache.get(certsUrl);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(certsUrl));
    jwksCache.set(certsUrl, jwks);
  }

  try {
    const { payload } = await jwtVerify(assertion, jwks, {
      audience,
      issuer: `https://${normalizedDomain}`,
    });
    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
    if (!email) {
      reportAdminAuthFailure(
        {
          message: "Cloudflare Access authentication failed",
          stage: "identity_claim",
          emailClaimPresent: false,
        },
      );
      return null;
    }
    return { displayName: email, email, fullName: null };
  } catch (error) {
    reportAdminAuthFailure(
      {
        message: "Cloudflare Access authentication failed",
        stage: "jwt_verification",
        ...jwtErrorMetadata(error),
      },
    );
    return null;
  }
}

export async function getAdmin(): Promise<AdminIdentity | null> {
  const accessIdentity = await getCloudflareAccessUser();
  const appEnv = await runtimeValue("APP_ENV");
  const identity =
    accessIdentity ??
    (appEnv === "production" || appEnv === "staging"
      ? null
      : await getChatGPTUser());
  if (!identity) return null;

  const allowlist = await adminEmails();
  if (!allowlist.has(identity.email.toLowerCase())) {
    reportAdminAuthFailure(
      {
        message: "Administrator allowlist check failed",
        stage: "administrator_allowlist",
        allowlistEntryCount: allowlist.size,
        identityPresent: true,
      },
    );
    return null;
  }
  return identity;
}

export async function requireAdmin(returnTo = "/admin") {
  void returnTo;
  return getAdmin();
}

export async function adminSignOutPath(returnTo = "/"): Promise<string> {
  const teamDomain = await runtimeValue("CF_ACCESS_TEAM_DOMAIN");
  if (teamDomain) return "/cdn-cgi/access/logout";
  return chatGPTSignOutPath(returnTo);
}
