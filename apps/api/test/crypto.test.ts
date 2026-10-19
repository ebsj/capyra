import { describe, expect, it } from "vitest";
import { hashPassword, pkceChallenge, sha256, verifyPassword } from "../src/crypto";

describe("Web Crypto compatibility", () => {
  it("creates the stable PBKDF2 password format", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).toMatch(/^pbkdf2-sha256\$100000\$[^$]+\$[^$]+$/);
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });

  it("creates an RFC 7636 S256 challenge", async () => {
    await expect(pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"))
      .resolves.toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("hashes opaque grants deterministically", async () => {
    await expect(sha256("grant")).resolves.toBe("3492ad65d05a973fef8c825521eeb41ae64625a672a8aeeeabc696e16d62a020");
  });
});
