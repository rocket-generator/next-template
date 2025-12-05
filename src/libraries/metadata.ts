import type { Metadata } from "next";
import { SERVICE_DESCRIPTION, SERVICE_NAME } from "@/constants/site";

export function buildTitle(pageTitle?: string | null) {
  const trimmed = pageTitle?.trim();
  if (!trimmed) return SERVICE_NAME;
  return `${trimmed} | ${SERVICE_NAME}`;
}

type MetadataParams = Partial<Metadata> & {
  title?: string | null;
  description?: string | null;
};

export function createMetadata(params: MetadataParams = {}): Metadata {
  const { title, description, openGraph, twitter, ...rest } = params;
  const computedTitle = buildTitle(title);
  const computedDescription = description?.trim() || SERVICE_DESCRIPTION;

  return {
    title: computedTitle,
    description: computedDescription,
    openGraph: {
      title: computedTitle,
      description: computedDescription,
      ...openGraph,
    },
    twitter: {
      title: computedTitle,
      description: computedDescription,
      ...twitter,
    },
    ...rest,
  };
}
