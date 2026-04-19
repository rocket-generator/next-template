const router = {
  back: () => {},
  forward: () => {},
  prefetch: () => Promise.resolve(),
  push: () => {},
  refresh: () => {},
  replace: () => {},
};

export function usePathname() {
  return "/storybook";
}

export function useRouter() {
  return router;
}

export function useSearchParams() {
  return new URLSearchParams("token=storybook-token");
}

export function notFound(): never {
  throw new Error("next/navigation notFound() called in Storybook");
}

export function redirect(path: string): never {
  throw new Error(`next/navigation redirect(${path}) called in Storybook`);
}
