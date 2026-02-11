import type { TxSecureRecord } from "./types.js";

const HEX_REGEX = /^[0-9a-fA-F]*$/;

export function hexToBuffer(hex: string): Buffer {
  if (typeof hex !== "string" || hex.length % 2 !== 0) {
    throw new Error("Invalid hex: must be a string of even length");
  }
  if (!HEX_REGEX.test(hex)) {
    throw new Error("Invalid hex: must contain only 0-9 and a-f");
  }
  return Buffer.from(hex, "hex");
}

const NONCE_BYTES = 12;
const TAG_BYTES = 16;

export function validateRecord(record: TxSecureRecord): void {
  const checkHexLength = (name: string, hex: string, expectedBytes: number) => {
    const buf = hexToBuffer(hex);
    if (buf.length !== expectedBytes) {
      throw new Error(
        `Invalid ${name}: expected ${expectedBytes} bytes after hex decode, got ${buf.length}`
      );
    }
  };

  checkHexLength("payload_nonce", record.payload_nonce, NONCE_BYTES);
  checkHexLength("payload_tag", record.payload_tag, TAG_BYTES);
  checkHexLength("dek_wrap_nonce", record.dek_wrap_nonce, NONCE_BYTES);
  checkHexLength("dek_wrap_tag", record.dek_wrap_tag, TAG_BYTES);

  hexToBuffer(record.payload_ct);
  hexToBuffer(record.dek_wrapped);
}
