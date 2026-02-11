import { createDecipheriv } from "node:crypto";
import type { TxSecureRecord } from "./types.js";
import { getMasterKey } from "./encrypt.js";
import { hexToBuffer, validateRecord } from "./validate.js";

const ALG = "aes-256-gcm";

export function decrypt(record: TxSecureRecord): unknown {
  try {
    validateRecord(record);

    const masterKey = getMasterKey();

    const dekWrapNonce = hexToBuffer(record.dek_wrap_nonce);
    const dekWrapped = hexToBuffer(record.dek_wrapped);
    const dekWrapTag = hexToBuffer(record.dek_wrap_tag);

    const dekDecipher = createDecipheriv(ALG, masterKey, dekWrapNonce, {
      authTagLength: 16,
    });
    dekDecipher.setAuthTag(dekWrapTag);
    const dek = Buffer.concat([
      dekDecipher.update(dekWrapped),
      dekDecipher.final(),
    ]);

    const payloadNonce = hexToBuffer(record.payload_nonce);
    const payloadCt = hexToBuffer(record.payload_ct);
    const payloadTag = hexToBuffer(record.payload_tag);

    const payloadDecipher = createDecipheriv(ALG, dek, payloadNonce, {
      authTagLength: 16,
    });
    payloadDecipher.setAuthTag(payloadTag);
    const payloadPlain = Buffer.concat([
      payloadDecipher.update(payloadCt),
      payloadDecipher.final(),
    ]);

    const json = payloadPlain.toString("utf8");
    return JSON.parse(json);
  } catch (err) {
    throw new Error("Decryption failed");
  }
}

