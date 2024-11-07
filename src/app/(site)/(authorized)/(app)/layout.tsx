import React from "react";
import { auth } from "@/libraries/auth";

import { UserRepository } from "@/repositories/user_repository";
import AuthError from "@/exceptions/auth_error";
import { redirect, notFound } from "next/navigation";
import { User } from "@/models/user";

type Props = {
  children: React.ReactNode;
};

export default async function SiteLayout({ children }: Props) {
  const session = await auth();
  let me: User | null = null;
  try {
    const repository = new UserRepository(session?.access_token);
    me = await repository.getMe();
    if (!me) {
      return notFound();
    }
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/auth/signin");
    }
  }

  return <div>{children}</div>;
}
