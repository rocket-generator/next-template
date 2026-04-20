"use server";

import { signOut } from "@/libraries/auth";
import { redirect } from "next/navigation";

export async function signOutAction() {
  await signOut();
  redirect("/");
}
