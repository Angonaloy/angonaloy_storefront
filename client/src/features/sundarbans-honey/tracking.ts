const HONEY_PURCHASE_MARKER_PREFIX = "sundarbans-honey-purchase-tracked-v1:";

type HoneyTrackingStorage = Pick<Storage, "getItem" | "setItem">;

export function markPurchaseTracked(
  storage: HoneyTrackingStorage | undefined,
  orderRef: string,
) {
  const normalizedOrderRef = orderRef.trim();
  if (!storage || !normalizedOrderRef) return false;

  const marker = `${HONEY_PURCHASE_MARKER_PREFIX}${normalizedOrderRef}`;
  try {
    if (storage.getItem(marker) !== null) return false;
    storage.setItem(marker, "1");
    return true;
  } catch {
    return false;
  }
}
