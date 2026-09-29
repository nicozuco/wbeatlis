import { AppShell } from "@/components/layout/app-shell";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getUserSettings } from "@/lib/user-settings";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuthenticatedUser();
  const settings = await getUserSettings(user.id);
  return <AppShell userEmail={user.email} settings={settings}>{children}</AppShell>;
}
