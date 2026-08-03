import { env } from "cloudflare:workers";

export async function platformRuntimeEnv(): Promise<unknown> {
  return env;
}
