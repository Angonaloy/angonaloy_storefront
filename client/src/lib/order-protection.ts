import { useState } from "react";

const SESSION_KEY = "mlbd_checkout_session_id";

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateClientSessionId(storage: Pick<Storage, "getItem" | "setItem"> | undefined = typeof window === "undefined" ? undefined : window.sessionStorage) {
  if (!storage) return randomId();
  try {
    const current = storage.getItem(SESSION_KEY);
    if (current) return current;
    const next = randomId();
    storage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return randomId();
  }
}

export function useCheckoutProtectionSignals() {
  const [clientSessionId] = useState(() => getOrCreateClientSessionId());
  const [checkoutStartedAt] = useState(() => new Date().toISOString());
  const [turnstileToken, setTurnstileToken] = useState("");
  return { clientSessionId, checkoutStartedAt, turnstileToken, setTurnstileToken };
}
