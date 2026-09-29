import packageJson from "@/package.json";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pushConfigured } from "@/lib/push";
import { getUserSettings } from "@/lib/user-settings";
import { parseVaultServerKey } from "@/lib/vault-cipher";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ seccion?: string }> }) {
  const { seccion } = await searchParams;
  const user = await requireAuthenticatedUser();
  const [settings, devices, databaseOk, reminderCount] = await Promise.all([
    getUserSettings(user.id),
    prisma.pushSubscription.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, userId: true, userAgent: true, createdAt: true, lastSuccessAt: true } }),
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    prisma.reminder.count({ where: { sentAt: null, doneAt: null } }),
  ]);
  let vaultConfigured = false;
  try { parseVaultServerKey(process.env.VAULT_SERVER_KEY); vaultConfigured = true; } catch { /* Clave ausente o no válida. */ }

  return (
    <SettingsWorkspace
      initialSection={seccion}
      email={user.email}
      settings={settings}
      vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
      devices={devices.map((device) => ({ id: device.id, mine: device.userId === user.id, userAgent: device.userAgent, createdAt: device.createdAt.toISOString(), lastSuccessAt: device.lastSuccessAt?.toISOString() ?? null }))}
      system={{
        version: packageJson.version,
        environment: process.env.VERCEL_ENV ?? "local",
        database: databaseOk,
        push: pushConfigured(),
        vault: vaultConfigured,
        pendingReminders: reminderCount,
      }}
    />
  );
}
