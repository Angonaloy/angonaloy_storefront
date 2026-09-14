const HONEY_NUT_PURCHASE_MARKER_PREFIX = "honey-nut-purchase-tracked-v1:";
type HoneyNutTrackingStorage = Pick<Storage, "getItem" | "setItem">;

export function markHoneyNutPurchaseTracked(storage: HoneyNutTrackingStorage | undefined, orderRef: string) {
  const normalizedOrderRef = orderRef.trim();
  if (!storage || !normalizedOrderRef) return false;
  const marker = `${HONEY_NUT_PURCHASE_MARKER_PREFIX}${normalizedOrderRef}`;
  try {
    if (storage.getItem(marker) !== null) return false;
    storage.setItem(marker, "1");
    return true;
  } catch {
    return false;
  }
}
