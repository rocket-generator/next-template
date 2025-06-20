"use server";

import { signOut as nextAuthSignOut } from "@/libraries/auth";
 
export async function signOutAction() {
  await nextAuthSignOut();
} 