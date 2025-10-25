"use client";
import { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "use-intl";

export function Providers({
  children,
  messages,
  locale,
}: {
  children: ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
}) {
  //  const locale = await getLocale();

  return (
    <NextIntlClientProvider
      messages={messages}
      locale={locale}
      timeZone="Asia/Tokyo"
    >
      {children}
    </NextIntlClientProvider>
  );
}
