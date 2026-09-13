export type KalojiraCheckoutStatus = "loading" | "ready" | "error" | "unavailable";

export type KalojiraFieldName =
  | "pack"
  | "quantity"
  | "name"
  | "phone"
  | "address";

export type KalojiraFieldErrors = Partial<Record<KalojiraFieldName, string>>;

export const KALOJIRA_FIELD_ORDER: readonly KalojiraFieldName[] = [
  "pack",
  "quantity",
  "name",
  "phone",
  "address",
];

export function resolveKalojiraCheckoutStatus(input: {
  hasProduct: boolean;
  hasOrderablePacks: boolean;
  productIsPending: boolean;
  productIsError: boolean;
  inventoryIsError: boolean;
  inventoryIsFetched: boolean;
  hasInventory: boolean;
}): KalojiraCheckoutStatus {
  if (input.productIsError) return "error";
  if (input.productIsPending && !input.hasProduct) return "loading";
  if (!input.hasProduct) return "unavailable";
  if (!input.hasOrderablePacks) return "unavailable";

  // A missing inventory payload is an unknown sync state, not proof that a
  // catalog product is sold out. The submit handler revalidates the selected
  // variant against the live inventory feed before creating an order.
  return "ready";
}

export function getFirstKalojiraInvalidField(errors: KalojiraFieldErrors) {
  return KALOJIRA_FIELD_ORDER.find((field) => Boolean(errors[field])) ?? null;
}

export function getKalojiraFocusTargetId(
  errors: KalojiraFieldErrors,
  selectedVariantId: string,
  renderedVariantIds: string[],
) {
  const firstField = getFirstKalojiraInvalidField(errors);
  if (!firstField) return null;
  if (firstField !== "pack") return `kalojira-${firstField}`;

  const targetVariantId = renderedVariantIds.includes(selectedVariantId)
    ? selectedVariantId
    : renderedVariantIds[0];
  return targetVariantId ? `kalojira-pack-${targetVariantId}` : "kalojira-pack";
}
