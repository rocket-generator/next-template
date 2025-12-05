export const DEFAULT_SERVICE_NAME = "TypeScript Next Template";
export const DEFAULT_SERVICE_DESCRIPTION =
  "TypeScript, Next.js, Tailwind CSS で構築されたフルスタックテンプレート。認証・DB・i18n が標準搭載。";

export const SERVICE_NAME =
  (process.env.NEXT_PUBLIC_SERVICE_NAME || "").trim() || DEFAULT_SERVICE_NAME;

export const SERVICE_DESCRIPTION =
  (process.env.NEXT_PUBLIC_SERVICE_DESCRIPTION || "").trim() ||
  DEFAULT_SERVICE_DESCRIPTION;
