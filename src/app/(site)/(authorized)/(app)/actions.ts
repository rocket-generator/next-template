"use server";

import { signOut as nextAuthSignOut } from "@/libraries/auth";
import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";
import { auth } from "@/libraries/auth";
import { UserRepository } from "@/repositories/user_repository";

export async function signOutAction() {
  await nextAuthSignOut();
}

export async function setLanguageAction(
  locale: (typeof routing.locales)[number],
  persist: boolean = true
) {
  const supportedLocales = routing.locales;
  const safeLocale = supportedLocales.includes(locale) ? locale : "en";

  // Set NEXT_LOCALE cookie for next-intl
  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", safeLocale, { path: "/" });

  if (persist) {
    try {
      const session = await auth();
      const userId = (session?.user?.id as string | undefined) ?? undefined;
      if (userId) {
        const repo = new UserRepository();
        await repo.updateUserData(userId, { language: safeLocale });
      }
    } catch {
      // Ignore persistence errors; cookie switch still applies
    }
  }

  return { success: true, locale: safeLocale };
}
