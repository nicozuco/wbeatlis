import { VaultWorkspace } from "@/components/vault/vault-workspace";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertVaultReady, openVaultAccounts } from "@/lib/vault-server";

export const dynamic = "force-dynamic";

export default async function PasswordsPage() {
  await requireAuthenticatedUser();
  assertVaultReady();
  const items = await prisma.vaultItem.findMany({ orderBy: [{ category: "asc" }, { title: "asc" }] });
  return (
    <VaultWorkspace
      items={items.map(({ id, title, url, category, description, secret }) => {
        try {
          return { id, title, url, category, description, accounts: secret ? openVaultAccounts(secret) : [], unavailable: false };
        } catch {
          // No presentar como vacía una entrada antigua o dañada para evitar
          // sobrescribir sus credenciales por accidente.
          return { id, title, url, category, description, accounts: [], unavailable: true };
        }
      })}
    />
  );
}
