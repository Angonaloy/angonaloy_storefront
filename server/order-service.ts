import { z } from "zod";

const addressWordCount = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

export const orderRequestSchema = z.object({
  bundleTitle: z.string().trim().min(1).max(200),
  bundleDetails: z.string().trim().min(1).max(300),
  bundlePrice: z.number().int().positive().max(10_000_000).refine(Number.isSafeInteger),
  quantity: z.number().int().min(1).max(100).refine(Number.isSafeInteger),
  deliveryCharge: z.number().int().min(0).max(100_000).refine(Number.isSafeInteger),
  customerName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^\d{11}$/, "Phone number must contain exactly 11 English digits"),
  address: z.string().trim().min(5).max(500),
  paymentMethod: z.enum(["cash_on_delivery", "bkash"]).default("cash_on_delivery"),
  bkashTrxId: z.string().trim().max(80).optional().default(""),
  metaEventId: z.string().trim().max(128).optional(),
  trackingMode: z.enum(["default", "google_only"]).default("default"),
}).refine(
  (order) => order.paymentMethod !== "bkash" || order.bkashTrxId.length > 0,
  {
    message: "bKash reference ID is required",
    path: ["bkashTrxId"],
  },
).refine(
  (order) => addressWordCount(order.address) >= 3,
  {
    message: "Address must contain at least three words",
    path: ["address"],
  },
).refine(
  (order) => Number.isSafeInteger(order.bundlePrice + order.deliveryCharge),
  { message: "Order total is invalid" },
);

export type OrderRequest = z.infer<typeof orderRequestSchema>;

export class OrderUpstreamError extends Error {
  constructor() {
    super("Merchant-Suite did not confirm the order");
    this.name = "OrderUpstreamError";
  }
}

type OrderServiceDependencies = {
  fetchImpl?: typeof fetch;
  merchantSuiteUrl?: string;
  apiKey?: string;
  timeoutSignal?: () => AbortSignal;
};

export function shouldSendMetaPurchase(order: Pick<OrderRequest, "trackingMode">) {
  return order.trackingMode !== "google_only";
}

function getCanonicalOrderRef(value: unknown) {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

export async function processOrder(order: OrderRequest, dependencies: OrderServiceDependencies = {}) {
  const configuredMerchantSuiteUrl = (dependencies.merchantSuiteUrl
    ?? (process.env.NODE_ENV === "production"
      ? "https://admin.mangolover.com.bd"
      : process.env.MERCHANT_SUITE_URL)
    ?? "").replace(/\/$/, "");
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  try {
    if (!configuredMerchantSuiteUrl) throw new Error("Missing Merchant-Suite configuration");
    const response = await fetchImpl(`${configuredMerchantSuiteUrl}/api/custom-orders/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": dependencies.apiKey ?? process.env.CUSTOM_ORDERS_API_KEY ?? ""
      },
      body: JSON.stringify({
        // We no longer send order_id, the dashboard generates it!
        customer_name: order.customerName,
        phone: order.phone,
        address: order.address,
        product: `${order.bundleTitle} - ${order.bundleDetails}`,
        quantity: order.quantity,
        price: order.bundlePrice,
        delivery_rate: order.deliveryCharge
      }),
      signal: (dependencies.timeoutSignal ?? (() => AbortSignal.timeout(10_000)))(),
    });

    if (!response.ok) {
      throw new Error(`Dashboard returned status ${response.status}`);
    }

    const data = await response.json() as { order_id?: unknown };
    const orderRef = getCanonicalOrderRef(data?.order_id);
    if (!orderRef) throw new Error("Missing canonical order ID");
    return { orderRef };
  } catch {
    throw new OrderUpstreamError();
  }
}
