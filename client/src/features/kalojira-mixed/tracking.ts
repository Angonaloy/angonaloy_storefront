const KALOJIRA_PURCHASE_MARKER_PREFIX = "kalojira-mixed-purchase-tracked-v1:";

type KalojiraTrackingStorage = Pick<Storage, "getItem" | "setItem">;

export function markKalojiraPurchaseTracked(
  storage: KalojiraTrackingStorage | undefined,
  orderRef: string,
) {
  const normalizedOrderRef = orderRef.trim();
  if (!storage || !normalizedOrderRef) return false;

  const marker = `${KALOJIRA_PURCHASE_MARKER_PREFIX}${normalizedOrderRef}`;
  try {
    if (storage.getItem(marker) !== null) return false;
    storage.setItem(marker, "1");
    return true;
  } catch {
    return false;
  }
}
