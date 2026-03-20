"use client";

import { useSession } from "@/libraries/auth-client";

type MaybeRecord = Record<string, unknown> | null | undefined;

function extractArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function getNestedProperty<T = unknown>(
  obj: MaybeRecord,
  key: string
): T | undefined {
  if (obj && typeof obj === "object" && key in obj) {
    return obj[key] as T;
  }
  return undefined;
}

export function useAuthSession() {
  const { data, isPending, error, refetch } = useSession();

  const raw = (data ?? null) as MaybeRecord;
  const session = (getNestedProperty(raw, "session") as MaybeRecord) ?? null;
  const user =
    (getNestedProperty(raw, "user") as MaybeRecord) ??
    (session ? (getNestedProperty(session, "user") as MaybeRecord) : null);

  return {
    session,
    user,
    permissions: extractArray(getNestedProperty(user, "permissions")),
    isPending,
    error,
    refetch,
  };
}
