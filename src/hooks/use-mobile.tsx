import * as React from "react";

const MOBILE_BREAKPOINT = 768;

function getMobileSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
}

function subscribeToMobileChanges(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener("change", callback);

  return () => mql.removeEventListener("change", callback);
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobileChanges,
    getMobileSnapshot,
    () => false
  );
}
