import { useTranslations } from "next-intl";
import Link from "next/link";

export default function EmailVerificationPendingPage() {
  const t = useTranslations("Auth");

  return (
    <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          {t("email_verification_pending")}
        </h1>
        <p className="mt-2 text-gray-600">
          {t("email_verification_pending_description")}
        </p>
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("check_your_email")}
          </h3>

          <p className="text-sm text-gray-600 mb-6">
            {t("verification_email_sent_description")}
          </p>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">{t("didnt_receive_email")}</p>

            <div className="flex justify-center space-x-4">
              <Link
                href="/verify-email/resend"
                className="font-medium text-gray-700 hover:underline"
              >
                {t("resend_verification_email")}
              </Link>

              <Link
                href="/signin"
                className="font-medium text-gray-700 hover:underline"
              >
                {t("back_to_signin")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
