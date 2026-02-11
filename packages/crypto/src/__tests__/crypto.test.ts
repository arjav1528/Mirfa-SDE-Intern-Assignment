import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt, validateRecord, hexToBuffer } from "../index.js";
import type { TxSecureRecord } from "../types.js";

const MASTER_KEY_HEX =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

beforeAll(() => {
  process.env.MASTER_KEY = MASTER_KEY_HEX;
});

describe("@repo/crypto", () => {
  it("encrypt then decrypt returns original payload", () => {
    const payload = { amount: 100, currency: "AED" };
    const record = encrypt("user-123", payload);
    expect(record.id).toBeDefined();
    expect(record.alg).toBe("aes-256-gcm");
    const decrypted = decrypt(record);
    expect(decrypted).toEqual(payload);
  });

  it("tampered payload_ct → decrypt throws", () => {
    const record = encrypt("user-123", { x: 1 });
    const tampered: TxSecureRecord = {
      ...record,
      payload_ct: record.payload_ct.slice(0, -2) + "ff",
    };
    expect(() => decrypt(tampered)).toThrow("Decryption failed");
  });

  it("tampered payload_tag → decrypt throws", () => {
    const record = encrypt("user-123", { x: 1 });
    const tampered: TxSecureRecord = {
      ...record,
      payload_tag: record.payload_tag.slice(0, -2) + "ff",
    };
    expect(() => decrypt(tampered)).toThrow("Decryption failed");
  });

  it("nonce not 12 bytes → validateRecord throws", () => {
    const record = encrypt("user-123", { x: 1 });
    const bad: TxSecureRecord = {
      ...record,
      payload_nonce: "aabbccdd", // 4 bytes only
    };
    expect(() => validateRecord(bad)).toThrow(/payload_nonce.*expected 12 bytes/);
  });

  it("invalid hex → hexToBuffer throws", () => {
    expect(() => hexToBuffer("zzzz")).toThrow(/Invalid hex/);
    expect(() => hexToBuffer("abc")).toThrow(/even length/);
  });
});
