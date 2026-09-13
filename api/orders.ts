import type { IncomingMessage, ServerResponse } from "http";
import { OrderProtectionError, type OrderProcessResult } from "../server/order-protection-errors.js";

export { OrderProtectionError } from "../server/order-protection-errors.js";

const MAX_REQUEST_BYTES = 32 * 1024;
const WEBHOOK_TIMEOUT_MS = 10_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type OrderRequest = {
  bundleTitle: string;
  bundleDetails: string;
  bundlePrice: number;
  quantity: number;
  deliveryCharge: number;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: "cash_on_delivery" | "bkash";
  bkashTrxId?: string;
  metaEventId?: string;
  trackingMode: "default" | "google_only";
  draftKey?: string;
  website?: string;
  turnstileToken?: string;
  clientSessionId?: string;
  checkoutStartedAt?: string;
  items?: Array<{ productId: string; variantId: string; quantity: number }>;
  shippingZoneId?: string;
};

class OrderValidationError extends Error {
  constructor() {
    super("Invalid order details");
    this.name = "OrderValidationError";
  }
}

class RequestBodyError extends Error {
  readonly statusCode: 400 | 413;

  constructor(statusCode: 400 | 413) {
    super(statusCode === 413 ? "Request body too large" : "Invalid request body");
    this.name = "RequestBodyError";
    this.statusCode = statusCode;
  }
}

export class OrderUpstreamError extends Error {
  constructor() {
    super("Merchant-Suite did not confirm the order");
    this.name = "OrderUpstreamError";
  }
}

type OrderServiceDependencies = {
  fetchImpl?: typeof fetch;
  merchantSuiteUrl?: string;
  storefrontHandle?: string;
  timeoutSignal?: () => AbortSignal;
};

type OrderHandlerDependencies = {
  processOrder?: (order: OrderRequest) => Promise<OrderProcessResult>;
  sendPurchaseCapi?: (options: {
    order: OrderRequest;
    orderRef: string;
    total: number;
    headers: Record<string, unknown>;
  }) => Promise<void>;
};

function byteLength(value: unknown) {
  try {
    return Buffer.byteLength(JSON.stringify(value));
  } catch {
    throw new RequestBodyError(400);
  }
}

async function readBody(req: IncomingMessage & { body?: unknown }) {
  if (req.body !== undefined) {
    if (byteLength(req.body) > MAX_REQUEST_BYTES) throw new RequestBodyError(413);
    return req.body;
  }

  const contentLength = Number(req.headers["content-length"]);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    throw new RequestBodyError(413);
  }

  const chunks: Buffer[] = [];
  let receivedBytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    receivedBytes += buffer.length;
    if (receivedBytes > MAX_REQUEST_BYTES) throw new RequestBodyError(413);
    chunks.push(buffer);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  try {
    return rawBody ? JSON.parse(rawBody) : {};
  } catch {
    throw new RequestBodyError(400);
  }
}

function requiredString(value: unknown, min: number, max: number) {
  if (typeof value !== "string") throw new OrderValidationError();
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) throw new OrderValidationError();
  return normalized;
}

function boundedInteger(value: unknown, min: number, max: number) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new OrderValidationError();
  }
  return value;
}

export function validateOrder(body: unknown): OrderRequest {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new OrderValidationError();
  }

  const value = body as Record<string, unknown>;
  const bundleTitle = requiredString(value.bundleTitle, 1, 200);
  const bundleDetails = requiredString(value.bundleDetails, 1, 300);
  const bundlePrice = boundedInteger(value.bundlePrice, 1, 10_000_000);
  const quantity = boundedInteger(value.quantity, 1, 100);
  const deliveryCharge = boundedInteger(value.deliveryCharge, 0, 100_000);
  const customerName = requiredString(value.customerName, 2, 120);
  const phone = requiredString(value.phone, 11, 11);
  const address = requiredString(value.address, 5, 500);
  const paymentMethod = value.paymentMethod === undefined
    ? "cash_on_delivery"
    : value.paymentMethod;
  const trackingMode = value.trackingMode === undefined ? "default" : value.trackingMode;

  if (!/^\d{11}$/.test(phone)
    || address.split(/\s+/).filter(Boolean).length < 3
    || (paymentMethod !== "cash_on_delivery" && paymentMethod !== "bkash")
    || (trackingMode !== "default" && trackingMode !== "google_only")
    || !Number.isSafeInteger(bundlePrice + deliveryCharge)) {
    throw new OrderValidationError();
  }

  let bkashTrxId = "";
  if (value.bkashTrxId !== undefined) {
    if (typeof value.bkashTrxId !== "string") throw new OrderValidationError();
    bkashTrxId = value.bkashTrxId.trim();
    if (bkashTrxId.length > 80) throw new OrderValidationError();
  }
  if (paymentMethod === "bkash" && !bkashTrxId) throw new OrderValidationError();

  let metaEventId = "";
  if (value.metaEventId !== undefined) {
    if (typeof value.metaEventId !== "string") throw new OrderValidationError();
    metaEventId = value.metaEventId.trim();
    if (metaEventId.length > 128) throw new OrderValidationError();
  }

  let draftKey = "";
  if (value.draftKey !== undefined) {
    draftKey = requiredString(value.draftKey, 36, 36).toLowerCase();
    if (!UUID_RE.test(draftKey)) throw new OrderValidationError();
  }

  const optionalString = (key: string, max: number) => {
    if (value[key] === undefined) return undefined;
    if (typeof value[key] !== "string" || value[key].length > max) throw new OrderValidationError();
    return value[key].trim();
  };
  const website = optionalString("website", 200);
  const turnstileToken = optionalString("turnstileToken", 4096);
  const clientSessionId = optionalString("clientSessionId", 120);
  const checkoutStartedAt = optionalString("checkoutStartedAt", 64);
  if (checkoutStartedAt && !Number.isFinite(Date.parse(checkoutStartedAt))) throw new OrderValidationError();
  if (clientSessionId && !/^[a-zA-Z0-9._:-]+$/.test(clientSessionId)) throw new OrderValidationError();

  let items: OrderRequest["items"];
  if (value.items !== undefined) {
    if (!Array.isArray(value.items) || value.items.length < 1 || value.items.length > 50) throw new OrderValidationError();
    items = value.items.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) throw new OrderValidationError();
      const candidate = item as Record<string, unknown>;
      if (typeof candidate.productId !== "string" || candidate.productId.trim().length < 1 || candidate.productId.length > 120
        || typeof candidate.variantId !== "string" || candidate.variantId.trim().length < 1 || candidate.variantId.length > 120
        || typeof candidate.quantity !== "number" || !Number.isSafeInteger(candidate.quantity) || candidate.quantity < 1 || candidate.quantity > 100) {
        throw new OrderValidationError();
      }
      return { productId: candidate.productId.trim(), variantId: candidate.variantId.trim(), quantity: candidate.quantity };
    });
  }
  const shippingZoneId = optionalString("shippingZoneId", 120);

  return {
    bundleTitle,
    bundleDetails,
    bundlePrice,
    quantity,
    deliveryCharge,
    customerName,
    phone,
    address,
    paymentMethod,
    ...(bkashTrxId ? { bkashTrxId } : {}),
    ...(metaEventId ? { metaEventId } : {}),
    ...(draftKey ? { draftKey } : {}),
    trackingMode,
    ...(website !== undefined ? { website } : {}),
    ...(turnstileToken !== undefined ? { turnstileToken } : {}),
    ...(clientSessionId !== undefined ? { clientSessionId } : {}),
    ...(checkoutStartedAt !== undefined ? { checkoutStartedAt } : {}),
    ...(items ? { items } : {}),
    ...(shippingZoneId !== undefined ? { shippingZoneId } : {}),
  };
}

function getCanonicalOrderRef(value: unknown) {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

export function shouldSendMetaPurchase(order: Pick<OrderRequest, "trackingMode">) {
  return order.trackingMode !== "google_only";
}

export async function processOrder(order: OrderRequest, dependencies: OrderServiceDependencies = {}) {
  const merchantSuiteUrl = (dependencies.merchantSuiteUrl
    ?? (process.env.NODE_ENV === "production"
      ? "https://admin.mangolover.com.bd"
      : process.env.MERCHANT_SUITE_URL)
    ?? "").replace(/\/$/, "");
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  try {
    const storefrontHandle = (dependencies.storefrontHandle ?? process.env.STOREFRONT_HANDLE ?? "").trim();
    if (!merchantSuiteUrl || !storefrontHandle) throw new Error("Missing Merchant-Suite configuration");
    const response = await fetchImpl(`${merchantSuiteUrl}/api/public/v1/${encodeURIComponent(storefrontHandle)}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        items: order.items,
        shippingZoneId: order.shippingZoneId,
        website: order.website,
        turnstileToken: order.turnstileToken,
        clientSessionId: order.clientSessionId,
        checkoutStartedAt: order.checkoutStartedAt,
        notes: `${order.bundleTitle} - ${order.bundleDetails}`,
        ...(order.draftKey ? { abandoned_checkout_draft_key: order.draftKey } : {}),
      }),
      signal: (dependencies.timeoutSignal ?? (() => AbortSignal.timeout(WEBHOOK_TIMEOUT_MS)))(),
    });
    const data = await response.json().catch(() => ({})) as {
      order_id?: unknown;
      orderRef?: unknown;
      orderId?: unknown;
      decision?: unknown;
      review_id?: unknown;
      reviewId?: unknown;
      retryable?: unknown;
    };
    if (response.status === 202 && data.decision === "review") {
      const reviewId = getCanonicalOrderRef(data.reviewId ?? data.review_id);
      if (!reviewId) throw new Error("Missing review ID");
      return { decision: "review", reviewId };
    }
    if (response.status === 403 || data.decision === "block") {
      throw new OrderProtectionError("block", data.retryable === true, response.status || 403);
    }
    if (!response.ok) throw new Error("Merchant-Suite rejected order");
    const orderRef = getCanonicalOrderRef(data.orderRef ?? data.order_id ?? data.orderId);
    if (!orderRef) throw new Error("Missing canonical order ID");
    return { orderRef, decision: "allow" };
  } catch (error) {
    if (error instanceof OrderProtectionError) throw error;
    throw new OrderUpstreamError();
  }
}

async function sendPurchaseCapi(options: {
  order: OrderRequest;
  orderRef: string;
  total: number;
  headers: Record<string, unknown>;
}) {
  const { getMetaUserDataFromRequest, sendMetaCapiEvent } = await import("../server/meta-capi.js");
  const user_data = getMetaUserDataFromRequest({
    headers: options.headers,
    customerName: options.order.customerName,
    phone: options.order.phone,
    eventSourceUrl: String(options.headers.referer || ""),
  });
  await sendMetaCapiEvent({
    event_name: "Purchase",
    event_id: options.order.metaEventId,
    event_source_url: String(options.headers.referer || ""),
    user_data,
    custom_data: {
      currency: "BDT",
      value: options.total,
      content_type: "product",
      contents: [{
        id: options.order.bundleTitle,
        quantity: options.order.quantity,
        item_price: options.order.bundlePrice / options.order.quantity,
      }],
      order_id: options.orderRef,
    },
  });
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export function createOrderHandler(dependencies: OrderHandlerDependencies = {}) {
  const process = dependencies.processOrder ?? processOrder;
  const sendPurchase = dependencies.sendPurchaseCapi ?? sendPurchaseCapi;

  return async function handler(
    req: IncomingMessage & { body?: unknown },
    res: ServerResponse,
  ) {
    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Method not allowed" });
      return;
    }

    try {
      const order = validateOrder(await readBody(req));
      const result = await process(order);
      const decision = result.decision ?? "allow";
      const orderRef = "orderRef" in result ? String(result.orderRef ?? "") : "";

      if (decision === "allow" && shouldSendMetaPurchase(order)) {
        void sendPurchase({
          order,
          orderRef,
          total: order.bundlePrice + order.deliveryCharge,
          headers: req.headers as unknown as Record<string, unknown>,
        }).catch(() => {
          console.warn("Meta Purchase CAPI failed");
        });
      }

      if (decision === "review") {
        sendJson(res, 202, { decision: "review", reviewId: "reviewId" in result ? result.reviewId : "" });
        return;
      }
      sendJson(res, 201, { orderRef, decision: "allow" });
    } catch (error) {
      if (error instanceof RequestBodyError) {
        sendJson(res, error.statusCode, { message: error.message });
        return;
      }
      if (error instanceof OrderValidationError) {
        sendJson(res, 400, { message: "Invalid order details" });
        return;
      }
      if (error instanceof OrderUpstreamError) {
        sendJson(res, 502, { message: "Could not confirm order. Please try again." });
        return;
      }
      if (error instanceof OrderProtectionError) {
        sendJson(res, error.statusCode, { message: error.message, decision: error.decision, retryable: error.retryable });
        return;
      }
      console.error("Order process failed");
      sendJson(res, 500, { message: "Could not place order. Please try again." });
    }
  };
}

export default createOrderHandler();
