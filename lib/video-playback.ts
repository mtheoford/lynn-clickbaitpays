/** Preserve the approved embed and locale settings when a visitor presses Play. */
export function videoPlaybackUrl(src: string): string {
  const url = new URL(src);
  url.searchParams.set("autoplay", "1");
  url.searchParams.set("playsinline", "1");
  return url.toString();
}
