/**
 * SEC-010: API key management.
 * Keys are SHA-256 hashed before storage. Plaintext returned only once at creation.
 */

import { createHash, randomBytes } from "node:crypto";

const API_KEY_PREFIX = "bk_";
const KEY_BYTE_LENGTH = 32;

export function generateApiKey(): { plaintext: string; hash: string } {
  const raw = randomBytes(KEY_BYTE_LENGTH).toString("hex");
  const plaintext = `${API_KEY_PREFIX}${raw}`;
  const hash = hashApiKey(plaintext);
  return { plaintext, hash };
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext, "utf8").digest("hex");
}
