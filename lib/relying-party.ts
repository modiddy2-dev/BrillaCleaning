export function relyingPartyFromUrl(origin: string): { origin: string; rpID: string } {
  const url = new URL(origin);
  return { origin: url.origin, rpID: url.hostname };
}

/** The browser origin must match the host that served the request. */
export function relyingParty(request: Request): { origin: string; rpID: string } | null {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || url.host;
  const hostname = host.split(":")[0] ?? "";
  if (!hostname) return null;
  const headerOrigin = request.headers.get("origin");
  if (headerOrigin && headerOrigin !== "null") {
    let parsed: URL;
    try {
      parsed = new URL(headerOrigin);
    } catch {
      return null;
    }
    if (parsed.hostname !== hostname) return null;
    return { origin: parsed.origin, rpID: parsed.hostname };
  }
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || url.protocol.replace(":", "");
  return relyingPartyFromUrl(`${proto}://${host}`);
}
