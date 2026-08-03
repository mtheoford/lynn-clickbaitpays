import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function platformRuntimeEnv(): Promise<unknown> {
  try {
    const context = await getCloudflareContext({ async: true });
    return context?.env ?? {};
  } catch {
    return {};
  }
}
