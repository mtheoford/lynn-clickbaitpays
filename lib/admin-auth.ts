import { getChatGPTUser, requireChatGPTUser } from "@/app/chatgpt-auth";

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requireAdmin(returnTo = "/admin") {
  const user = await requireChatGPTUser(returnTo);
  if (!adminEmails().has(user.email.toLowerCase())) return null;
  return user;
}

export async function getAdmin() {
  const user = await getChatGPTUser();
  if (!user || !adminEmails().has(user.email.toLowerCase())) return null;
  return user;
}

