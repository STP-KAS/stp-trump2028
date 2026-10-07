import { blake3 } from "@noble/hashes/blake3";

// KCC-1 names Hash as unkeyed BLAKE3. The lab uses that hash on the name bytes.
export function commitment(text) {
  const digest = blake3(new TextEncoder().encode(text));
  return Buffer.from(digest).toString("hex");
}
