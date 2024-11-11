import Link from "next/link";

type BreadcrumbLink = {
  href: string;
  label: string;
};

type Button = {
  href: string;
  label: string;
};

type Props = {
  breadcrumbLinks: BreadcrumbLink[];
  title: string;
  buttons?: Button[];
};

export default function AdminPageHeader({
  breadcrumbLinks,
  title,
  buttons,
}: Props) {
  return (
    <div className="sm:flex sm:items-center pb-6">
      <div className="sm:flex-auto">
        <nav className="flex mb-2" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            {breadcrumbLinks.map((link, index) => (
              <li key={index}>
                <div className="flex items-center">
                  {index > 0 && (
                    <svg
                      className="w-3 h-3 mx-1 text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 6 10"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m1 9 4-4-4-4"
                      />
                    </svg>
                  )}
                  <Link
                    href={link.href}
                    className="ml-1 text-sm font-medium text-gray-500 hover:text-blue-600 md:ml-2"
                  >
                    {link.label}
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>
      {buttons && buttons.length > 0 && (
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          {buttons.map((button, index) => (
            <Link
              key={index}
              href={button.href}
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {button.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
