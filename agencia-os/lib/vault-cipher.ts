import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import type { VaultAccount } from "@/lib/vault-crypto";

const PREFIX = "sv1";

export function parseVaultServerKey(value: string | undefined): Buffer {
  if (!value || !/^[A-Za-z0-9+/]{43}=$/.test(value)) throw new Error("VAULT_SERVER_KEY no está configurada correctamente.");
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("VAULT_SERVER_KEY debe contener 32 bytes.");
  return key;
}

export function encryptVaultAccounts(accounts: VaultAccount[], key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ accounts }), "utf8"), cipher.final()]);
  return `${PREFIX}.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptVaultAccounts(payload: string, key: Buffer): VaultAccount[] {
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== PREFIX) throw new Error("Formato de credenciales no compatible.");
  const iv = Buffer.from(parts[1], "base64url");
  const tag = Buffer.from(parts[2], "base64url");
  if (iv.length !== 12 || tag.length !== 16) throw new Error("Credenciales cifradas dañadas.");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(Buffer.from(parts[3], "base64url")), decipher.final()]).toString("utf8");
  const parsed: unknown = JSON.parse(plaintext);
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { accounts?: unknown }).accounts)) {
    throw new Error("Credenciales guardadas no válidas.");
  }
  return (parsed as { accounts: VaultAccount[] }).accounts;
}
