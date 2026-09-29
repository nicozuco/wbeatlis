import "server-only";

import { parseUserSettings } from "@/lib/preferences";
import { prisma } from "@/lib/prisma";

export async function getUserSettings(userId: string) {
  return parseUserSettings(await prisma.userPreference.findUnique({ where: { userId } }));
}
