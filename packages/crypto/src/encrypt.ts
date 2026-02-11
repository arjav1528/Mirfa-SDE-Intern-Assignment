import { randomBytes, createCipheriv, randomUUID } from "node:crypto";
import type { TxSecureRecord } from "./types.js";

const MASTER_KEY_BYTES = 32;
const DEK_BYTES = 32;
const NONCE_BYTES = 12;
const ALG = "aes-256-gcm";
const MK_VERSION = "v1";

function getMasterKey(): Buffer {

  const raw = process.env.MASTER_KEY;
  if (!raw || typeof raw !== "string") {
    throw new Error("MASTER_KEY is not set");
  }

  const trimmed = raw.trim();
  let buf: Buffer;

  if (/^[0-9a-fA-F]+$/.test(trimmed)) {
    if (trimmed.length !== 64) {
      throw new Error(
        `MASTER_KEY (hex) must be 64 characters (32 bytes), got ${trimmed.length}`
      );
    }
    buf = Buffer.from(trimmed, "hex");
  } else {
    buf = Buffer.from(trimmed, "base64");
    if (buf.length !== MASTER_KEY_BYTES) {
      throw new Error(
        `MASTER_KEY (base64) must decode to 32 bytes, got ${buf.length}`
      );
    }
  }

  return buf;
}

function bufferToHex(buf: Buffer): string {
  return buf.toString("hex");
}

export function encrypt(partyId: string, payload: object): TxSecureRecord {
  const masterKey = getMasterKey();

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  const dek = randomBytes(DEK_BYTES);
  const payloadNonce = randomBytes(NONCE_BYTES);

  const payloadPlaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const payloadCipher = createCipheriv(ALG, dek, payloadNonce, {
    authTagLength: 16,
  });
  const payloadCt = Buffer.concat([
    payloadCipher.update(payloadPlaintext),
    payloadCipher.final(),
  ]);
  const payloadTag = payloadCipher.getAuthTag();

  const dekWrapNonce = randomBytes(NONCE_BYTES);
  const dekCipher = createCipheriv(ALG, masterKey, dekWrapNonce, {
    authTagLength: 16,
  });
  const dekWrapped = Buffer.concat([
    dekCipher.update(dek),
    dekCipher.final(),
  ]);
  const dekWrapTag = dekCipher.getAuthTag();

  return {
    id,
    partyId,
    createdAt,
    payload_nonce: bufferToHex(payloadNonce),
    payload_ct: bufferToHex(payloadCt),
    payload_tag: bufferToHex(payloadTag),
    dek_wrap_nonce: bufferToHex(dekWrapNonce),
    dek_wrapped: bufferToHex(dekWrapped),
    dek_wrap_tag: bufferToHex(dekWrapTag),
    alg: ALG,
    mk_version: MK_VERSION,
  };
}
