import "server-only";

import { decryptVaultAccounts, encryptVaultAccounts, parseVaultServerKey } from "@/lib/vault-cipher";
import type { VaultAccount } from "@/lib/vault-crypto";

function vaultKey() {
  return parseVaultServerKey(process.env.VAULT_SERVER_KEY);
}

export function assertVaultReady() {
  vaultKey();
}

export function sealVaultAccounts(accounts: VaultAccount[]) {
  return encryptVaultAccounts(accounts, vaultKey());
}

export function openVaultAccounts(payload: string) {
  return decryptVaultAccounts(payload, vaultKey());
}
