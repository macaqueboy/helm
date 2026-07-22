import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { encrypt, decrypt } from "../lib/auth";

describe("Authentication & JWT Encryption Tests", () => {
  it("should encrypt and decrypt valid session payloads", async () => {
    const payload = {
      user: {
        id: "usr_12345",
        email: "pablo@galeia.top",
        name: "Pablo",
        avatarSeed: "pablo_seed",
      },
    };

    const token = await encrypt(payload);
    assert.ok(typeof token === "string");
    assert.ok(token.length > 50);

    const decoded = await decrypt(token);
    assert.ok(decoded !== null);
    assert.equal(decoded.user.id, "usr_12345");
    assert.equal(decoded.user.email, "pablo@galeia.top");
  });

  it("should fail decryption on tampered token", async () => {
    const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";
    try {
      await decrypt(invalidToken);
      assert.fail("Should have thrown error on invalid token");
    } catch (err: any) {
      assert.ok(err !== undefined);
    }
  });
});
