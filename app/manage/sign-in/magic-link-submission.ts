export const MAGIC_LINK_SUCCESS_MESSAGE =
  "If that email is connected to a site, a secure sign-in link is on its way.";

type MagicLinkForm = Pick<HTMLFormElement, "reset">;
type MagicLinkFetch = (
  input: string,
  init: RequestInit,
) => Promise<{ ok: boolean }>;

export async function submitMagicLinkRequest(
  email: FormDataEntryValue | null,
  formElement: MagicLinkForm,
  request: MagicLinkFetch = fetch,
): Promise<string> {
  const response = await request("/api/auth/magic-link", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw new Error("Sign-in email could not be sent.");

  try {
    formElement.reset();
  } catch (error) {
    console.error("Sign-in form could not be reset after a successful request.", error);
  }
  return MAGIC_LINK_SUCCESS_MESSAGE;
}
