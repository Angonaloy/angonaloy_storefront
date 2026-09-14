import { useEffect, useRef } from "react";
import {
  createAbandonedCartCapture,
  type AbandonedCartCapture,
  type AbandonedCartSource,
} from "@/lib/abandoned-cart-capture";

function getSessionStorage() {
  if (typeof window === "undefined") return undefined;
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function useAbandonedCartCapture(source: AbandonedCartSource): AbandonedCartCapture {
  const captureRef = useRef<AbandonedCartCapture | null>(null);
  if (!captureRef.current) {
    captureRef.current = createAbandonedCartCapture({ source, storage: getSessionStorage() });
  }
  const capture = captureRef.current;

  useEffect(() => {
    const retry = () => capture.retry();
    window.addEventListener("focus", retry);
    window.addEventListener("online", retry);
    return () => {
      window.removeEventListener("focus", retry);
      window.removeEventListener("online", retry);
      void capture.finalize();
      capture.dispose();
    };
  }, [capture]);

  return capture;
}
