import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { cookies } from "next/headers";

export default getRequestConfig(async ({ requestLocale }) => {
  // Resolve locale in order: Cookie(NEXT_LOCALE) -> requestLocale -> defaultLocale
  const cookieLocale = cookies().get("NEXT_LOCALE")?.value;
  let locale = cookieLocale || (await requestLocale);
  // Ensure that the incoming `locale` is valid
  if (
    !locale ||
    !routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    timeZone: "Asia/Tokyo",
    messages: (
      await (locale === "en"
        ? // When using Turbopack, this will enable HMR for `en`
          import("../../messages/en.json")
        : import(`../../messages/${locale}.json`))
    ).default,
  };
});
