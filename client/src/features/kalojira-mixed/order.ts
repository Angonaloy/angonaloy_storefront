import type { StorefrontProduct } from "../../lib/storefront-products.ts";
import { isProductOrderable } from "../../lib/storefront-product-orderability.ts";

export const KALOJIRA_DELIVERY_CHARGE = 0;
export const KALOJIRA_CONFIRMATION_KEY = "kalojira-mixed-order-confirmation-v1";

const MAX_PRICE = 10_000_000;
const MAX_QUANTITY = 100;

type KalojiraConfirmationStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type KalojiraPackOption = {
  variantId: string;
  label: string;
  unitPrice: number;
};

export type KalojiraOrderTotals = {
  unitPrice: number;
  quantity: number;
  subtotal: number;
  deliveryCharge: number;
  total: number;
};

export type KalojiraOrderPayload = {
  bundleTitle: string;
  bundleDetails: string;
  bundlePrice: number;
  quantity: number;
  deliveryCharge: number;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: "cash_on_delivery";
  trackingMode: "google_only";
};

export type KalojiraOrderConfirmation = {
  orderRef: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  deliveryCharge: number;
  total: number;
};

function isPositiveSafeInteger(value: unknown, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number"
    && Number.isSafeInteger(value)
    && value > 0
    && value <= max;
}

function requiredTrimmedString(value: unknown, maxLength: number, field: string) {
  if (typeof value !== "string") {
    throw new Error(`${field} is required`);
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new Error(`${field} is invalid`);
  }
  return trimmed;
}

export function getKalojiraPackOptions(product: StorefrontProduct): KalojiraPackOption[] {
  if (!isProductOrderable(product)) return [];

  return (product.variants ?? []).flatMap((variant) => {
    if (variant.available === false) return [];
    if (typeof variant.stock_quantity === "number" && variant.stock_quantity <= 0) return [];
    if (variant.id === undefined || variant.id === null) return [];

    const variantId = String(variant.id).trim();
    const size = variant.attributes?.size ?? variant.attributes?.kg;
    const label = typeof size === "string" || typeof size === "number"
      ? String(size).trim()
      : "";
    const unitPrice = typeof variant.price === "number" || typeof variant.price === "string"
      ? Number(variant.price)
      : Number.NaN;

    if (!variantId || !label || !isPositiveSafeInteger(unitPrice, MAX_PRICE)) return [];
    return [{ variantId, label, unitPrice }];
  });
}

export function calculateKalojiraOrder(unitPrice: number, quantity: number, deliveryCharge = KALOJIRA_DELIVERY_CHARGE): KalojiraOrderTotals {
  if (!isPositiveSafeInteger(unitPrice, MAX_PRICE)) {
    throw new Error("Unit price is invalid");
  }
  if (!isPositiveSafeInteger(quantity, MAX_QUANTITY)) {
    throw new Error("Quantity is invalid");
  }

  const subtotal = unitPrice * quantity;
  const total = subtotal + deliveryCharge;
  if (!Number.isSafeInteger(subtotal) || subtotal > MAX_PRICE || !Number.isSafeInteger(total)) {
    throw new Error("Order total is invalid");
  }

  return {
    unitPrice,
    quantity,
    subtotal,
    deliveryCharge,
    total,
  };
}

export function buildKalojiraAddress(streetAddress: string, district = "", upazila = "") {
  const street = requiredTrimmedString(streetAddress, 300, "Street address");
  const parts = [street];
  const normalizedUpazila = upazila.trim();
  const normalizedDistrict = district.trim();
  if (normalizedUpazila) {
    if (normalizedUpazila.length > 100) throw new Error("Upazila is invalid");
    parts.push(normalizedUpazila);
  }
  if (normalizedDistrict) {
    if (normalizedDistrict.length > 100) throw new Error("District is invalid");
    parts.push(normalizedDistrict);
  }
  const address = parts.join(", ");
  if (address.length > 500) throw new Error("Address is invalid");
  return address;
}

export function buildKalojiraOrderPayload(input: {
  productName: string;
  pack: KalojiraPackOption;
  quantity: number;
  customerName: string;
  phone: string;
  address: string;
  deliveryCharge?: number;
}): KalojiraOrderPayload {
  const totals = calculateKalojiraOrder(input.pack.unitPrice, input.quantity, input.deliveryCharge);
  const customerName = requiredTrimmedString(input.customerName, 120, "Customer name");
  const phone = requiredTrimmedString(input.phone, 11, "Phone");
  const address = requiredTrimmedString(input.address, 500, "Address");
  if (customerName.length < 2
    || !/^\d{11}$/.test(phone)
    || address.length < 5
    || address.split(/\s+/).filter(Boolean).length < 3) {
    throw new Error("Customer details are invalid");
  }

  return {
    bundleTitle: requiredTrimmedString(input.productName, 200, "Product name"),
    bundleDetails: requiredTrimmedString(input.pack.label, 300, "Pack label"),
    bundlePrice: totals.subtotal,
    quantity: totals.quantity,
    deliveryCharge: totals.deliveryCharge,
    customerName,
    phone,
    address,
    paymentMethod: "cash_on_delivery",
    trackingMode: "google_only",
  };
}

export function buildKalojiraOrderConfirmation(
  orderRef: string,
  payload: KalojiraOrderPayload,
): KalojiraOrderConfirmation {
  const totals = calculateKalojiraOrder(payload.bundlePrice / payload.quantity, payload.quantity);
  return {
    orderRef: requiredTrimmedString(orderRef, 128, "Order reference"),
    productName: requiredTrimmedString(payload.bundleTitle, 200, "Product name"),
    variantLabel: requiredTrimmedString(payload.bundleDetails, 300, "Pack label"),
    ...totals,
  };
}

function parseKalojiraOrderConfirmation(value: unknown): KalojiraOrderConfirmation | null {
  if (!value || typeof value !== "object") return null;
  const confirmation = value as Record<string, unknown>;

  try {
    const orderRef = requiredTrimmedString(confirmation.orderRef, 128, "Order reference");
    const productName = requiredTrimmedString(confirmation.productName, 200, "Product name");
    const variantLabel = requiredTrimmedString(confirmation.variantLabel, 300, "Pack label");
    const quantity = confirmation.quantity;
    const unitPrice = confirmation.unitPrice;
    const subtotal = confirmation.subtotal;
    const total = confirmation.total;

    if (!isPositiveSafeInteger(quantity, MAX_QUANTITY)
      || !isPositiveSafeInteger(unitPrice, MAX_PRICE)
      || !Number.isSafeInteger(subtotal) || (subtotal as number) < 0
      || confirmation.deliveryCharge !== KALOJIRA_DELIVERY_CHARGE
      || !Number.isSafeInteger(total) || (total as number) < 0
      || subtotal !== unitPrice * quantity
      || total !== subtotal + KALOJIRA_DELIVERY_CHARGE) {
      return null;
    }

    return {
      orderRef,
      productName,
      variantLabel,
      quantity,
      unitPrice,
      subtotal: subtotal as number,
      deliveryCharge: KALOJIRA_DELIVERY_CHARGE,
      total: total as number,
    };
  } catch {
    return null;
  }
}

export function writeKalojiraOrderConfirmation(
  storage: KalojiraConfirmationStorage | undefined,
  confirmation: KalojiraOrderConfirmation,
) {
  if (!storage) return false;
  const safeConfirmation = parseKalojiraOrderConfirmation(confirmation);
  if (!safeConfirmation) return false;

  try {
    storage.setItem(KALOJIRA_CONFIRMATION_KEY, JSON.stringify(safeConfirmation));
    return true;
  } catch {
    return false;
  }
}

export function readKalojiraOrderConfirmation(storage: KalojiraConfirmationStorage | undefined) {
  if (!storage) return null;
  try {
    const serialized = storage.getItem(KALOJIRA_CONFIRMATION_KEY);
    return serialized ? parseKalojiraOrderConfirmation(JSON.parse(serialized)) : null;
  } catch {
    return null;
  }
}

export function clearKalojiraOrderConfirmation(storage: KalojiraConfirmationStorage | undefined) {
  try {
    storage?.removeItem(KALOJIRA_CONFIRMATION_KEY);
  } catch {
    // Storage can be unavailable in privacy modes. Clearing remains best-effort.
  }
}
