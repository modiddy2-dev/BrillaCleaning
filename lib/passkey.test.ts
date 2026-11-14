import { describe, expect, it } from "vitest";
import { relyingParty, relyingPartyFromUrl } from "./relying-party";

describe("passkey relying party", () => {
  it("uses the hostname, not the port, as the Face ID relying party", () => {
    expect(relyingPartyFromUrl("http://localhost:3000")).toEqual({ origin: "http://localhost:3000", rpID: "localhost" });
    expect(relyingPartyFromUrl("https://brilla.example.com/owner")).toEqual({ origin: "https://brilla.example.com", rpID: "brilla.example.com" });
  });

  it("rejects an origin that does not match the request host", () => {
    const request = new Request("http://localhost:3000/api/auth/webauthn/login/options", {
      headers: { origin: "https://evil.example", host: "localhost:3000" },
    });
    expect(relyingParty(request)).toBeNull();
  });

  it("accepts the same host the browser used", () => {
    const request = new Request("http://localhost:3000/api/auth/webauthn/login/options", {
      headers: { origin: "http://localhost:3000", host: "localhost:3000" },
    });
    expect(relyingParty(request)).toEqual({ origin: "http://localhost:3000", rpID: "localhost" });
  });
});
