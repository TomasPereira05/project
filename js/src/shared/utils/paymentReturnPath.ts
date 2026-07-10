const PAYMENT_RETURN_PATH_KEY = "jagoz.payment.returnPath";

function currentPath() {
  if (typeof window === "undefined") {
    return "/";
  }

  const { pathname, search, hash } = window.location;
  const path = `${pathname}${search}${hash}`;
  return path.startsWith("/payments/") ? "/" : path;
}

function isSafeLocalPath(path: string | null): path is string {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/payments/"));
}

export function getPaymentReturnPath(fallback = "/") {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const storedPath = window.sessionStorage.getItem(PAYMENT_RETURN_PATH_KEY);
    return isSafeLocalPath(storedPath) ? storedPath : fallback;
  } catch {
    return fallback;
  }
}

export function clearPaymentReturnPath() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(PAYMENT_RETURN_PATH_KEY);
  } catch {
    // Ignore browsers/storage modes that block sessionStorage.
  }
}

export function redirectToPaymentCheckout(checkoutUrl: string) {
  try {
    window.sessionStorage.setItem(PAYMENT_RETURN_PATH_KEY, currentPath());
  } catch {
    // The redirect should still happen even if the return path cannot be stored.
  }

  window.location.assign(checkoutUrl);
}
