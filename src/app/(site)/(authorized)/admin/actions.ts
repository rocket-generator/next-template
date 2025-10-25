"use server";

import { signOut } from "@/libraries/auth";

export async function signOutAction() {
  await signOut();
}
