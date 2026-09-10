import type { IncomingMessage, ServerResponse } from "http";

const MAX_REQUEST_BYTES = 32 * 1024;
const WEBHOOK_TIMEOUT_MS = 10_000;

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
  apiKey?: string;
  timeoutSignal?: () => AbortSignal;
};

type OrderHandlerDependencies = {
  processOrder?: (order: OrderRequest) => Promise<{ orderRef: string }>;
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
    trackingMode,
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
    if (!merchantSuiteUrl) throw new Error("Missing Merchant-Suite configuration");
    const response = await fetchImpl(`${merchantSuiteUrl}/api/custom-orders/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": dependencies.apiKey ?? process.env.CUSTOM_ORDERS_API_KEY ?? "",
      },
      body: JSON.stringify({
        customer_name: order.customerName,
        phone: order.phone,
        address: order.address,
        product: `${order.bundleTitle} - ${order.bundleDetails}`,
        quantity: order.quantity,
        price: order.bundlePrice,
        delivery_rate: order.deliveryCharge,
      }),
      signal: (dependencies.timeoutSignal ?? (() => AbortSignal.timeout(WEBHOOK_TIMEOUT_MS)))(),
    });
    if (!response.ok) throw new Error("Merchant-Suite rejected order");

    const data = await response.json() as { order_id?: unknown };
    const orderRef = getCanonicalOrderRef(data?.order_id);
    if (!orderRef) throw new Error("Missing canonical order ID");
    return { orderRef };
  } catch {
    throw new OrderUpstreamError();
  }
}

async function sendPurchaseCapi(options: {
  order: OrderRequest;
  orderRef: string;
  total: number;
  headers: Record<string, unknown>;
}) {
  const { getMetaUserDataFromRequest, sendMetaCapiEvent } = await import("../server/meta-capi");
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

      if (shouldSendMetaPurchase(order)) {
        void sendPurchase({
          order,
          orderRef: result.orderRef,
          total: order.bundlePrice + order.deliveryCharge,
          headers: req.headers as unknown as Record<string, unknown>,
        }).catch(() => {
          console.warn("Meta Purchase CAPI failed");
        });
      }

      sendJson(res, 201, { orderRef: result.orderRef });
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
      console.error("Order process failed");
      sendJson(res, 500, { message: "Could not place order. Please try again." });
    }
  };
}

export default createOrderHandler();
