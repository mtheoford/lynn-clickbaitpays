import { createRemoteJWKSet, jwtVerify } from "jose";
import { headers } from "next/headers";
import {
  chatGPTSignInPath,
  getChatGPTUser,
  chatGPTSignOutPath,
} from "@/app/chatgpt-auth";
import { runtimeValue } from "@/lib/runtime";

export type AdminIdentity = {
  displayName: string;
  email: string;
  fullName: string | null;
};

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

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
  if (!audience || !teamDomain) return null;

  const assertion = (await headers()).get("cf-access-jwt-assertion");
  if (!assertion) return null;
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
    if (!email) return null;
    return { displayName: email, email, fullName: null };
  } catch {
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
  if (!identity || !(await adminEmails()).has(identity.email.toLowerCase())) return null;
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

export async function adminSignInPath(returnTo = "/admin"): Promise<string> {
  const teamDomain = await runtimeValue("CF_ACCESS_TEAM_DOMAIN");
  return teamDomain ? returnTo : chatGPTSignInPath(returnTo);
}
