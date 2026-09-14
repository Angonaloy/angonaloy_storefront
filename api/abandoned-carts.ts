import type { IncomingMessage, ServerResponse } from "node:http";
import { isIP } from "node:net";

const MAX_REQUEST_BYTES = 32 * 1024;
const MAX_MONEY = 10_000_000;
const CAPTURE_TIMEOUT_MS = 5_000;

const sourcePaths = {
  storefront: "/checkout",
  sundarbans_honey: "/step/sundarbans-natural-honey",
  kalojira_mixed: "/step/kalojira-mixed",
  honey_nut: "/step/honey-nut",
} as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AbandonedCartSource = keyof typeof sourcePaths;
type CampaignKey = "utmSource" | "utmMedium" | "utmCampaign" | "utmContent" | "utmTerm";

export type AbandonedCartCapture = {
  draftKey: string;
  source: AbandonedCartSource;
  sourcePath: string;
  customerName?: string;
  phone: string;
  address?: string;
  items: Array<{
    productName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  deliveryRate: number;
  total: number;
  campaign: Partial<Record<CampaignKey, string>>;
};

export class AbandonedCartValidationError extends Error {
  constructor() {
    super("Invalid abandoned cart capture");
    this.name = "AbandonedCartValidationError";
  }
}

export class AbandonedCartUpstreamError extends Error {
  constructor() {
    super("Merchant-Suite did not save the abandoned cart");
    this.name = "AbandonedCartUpstreamError";
  }
}

class RequestBodyError extends Error {
  readonly statusCode: 400 | 413;

  constructor(statusCode: 400 | 413) {
    super(statusCode === 413 ? "Request body too large" : "Invalid request body");
    this.statusCode = statusCode;
  }
}

type CaptureHandlerDependencies = {
  processCapture?: (
    capture: AbandonedCartCapture,
    context?: { forwardedClientIp?: string },
  ) => Promise<void>;
};

type AbandonedCartServiceDependencies = {
  fetchImpl?: typeof fetch;
  merchantSuiteUrl?: string;
  apiKey?: string;
  timeoutSignal?: () => AbortSignal;
  forwardedClientIp?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStrictRecord(value: unknown, allowedKeys: readonly string[]): value is Record<string, unknown> {
  return isRecord(value) && Object.keys(value).every((key) => allowedKeys.includes(key));
}

function requiredValue(record: Record<string, unknown>, key: string) {
  if (!Object.hasOwn(record, key)) throw new AbandonedCartValidationError();
  return record[key];
}

function optionalValue(record: Record<string, unknown>, key: string) {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}

function requiredText(value: unknown, maxLength?: number) {
  if (typeof value !== "string") throw new AbandonedCartValidationError();
  const normalized = value.trim();
  if (!normalized || (maxLength !== undefined && normalized.length > maxLength)) {
    throw new AbandonedCartValidationError();
  }
  return normalized;
}

function optionalText(value: unknown, maxLength: number) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new AbandonedCartValidationError();
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new AbandonedCartValidationError();
  return normalized || undefined;
}

function boundedMoney(value: unknown) {
  if (
    typeof value !== "number"
    || !Number.isFinite(value)
    || value < 0
    || value > MAX_MONEY
    || Math.round(value * 100) / 100 !== value
  ) {
    throw new AbandonedCartValidationError();
  }
  return value;
}

function parseItems(value: unknown): AbandonedCartCapture["items"] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) {
    throw new AbandonedCartValidationError();
  }

  return value.map((item) => {
    if (!isStrictRecord(item, ["productName", "variantName", "quantity", "unitPrice"])) {
      throw new AbandonedCartValidationError();
    }
    const quantity = requiredValue(item, "quantity");
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new AbandonedCartValidationError();
    }

    return {
      productName: requiredText(requiredValue(item, "productName"), 200),
      variantName: optionalText(optionalValue(item, "variantName"), 160),
      quantity,
      unitPrice: boundedMoney(requiredValue(item, "unitPrice")),
    };
  });
}

function parseCampaign(value: unknown): AbandonedCartCapture["campaign"] {
  if (value === undefined) return {};
  const campaignKeys: CampaignKey[] = ["utmSource", "utmMedium", "utmCampaign", "utmContent", "utmTerm"];
  if (!isStrictRecord(value, campaignKeys)) throw new AbandonedCartValidationError();

  const campaign = Object.fromEntries(
    campaignKeys.flatMap((key) => {
      const normalized = optionalText(optionalValue(value, key), 120);
      return normalized ? [[key, normalized]] : [];
    }),
  );
  return campaign as AbandonedCartCapture["campaign"];
}

export function parseAbandonedCartCapture(body: unknown): AbandonedCartCapture {
  const captureKeys = [
    "draftKey",
    "source",
    "sourcePath",
    "customerName",
    "phone",
    "address",
    "items",
    "subtotal",
    "deliveryRate",
    "total",
    "campaign",
  ];
  if (!isStrictRecord(body, captureKeys)) throw new AbandonedCartValidationError();

  const draftKey = requiredText(requiredValue(body, "draftKey"));
  const source = requiredValue(body, "source");
  const sourcePath = requiredText(requiredValue(body, "sourcePath"), 120);
  const phone = requiredText(requiredValue(body, "phone"));
  if (!UUID_RE.test(draftKey) || typeof source !== "string" || !Object.hasOwn(sourcePaths, source) || !/^01\d{9}$/.test(phone)) {
    throw new AbandonedCartValidationError();
  }
  const normalizedSource = source as AbandonedCartSource;
  if (sourcePaths[normalizedSource] !== sourcePath) throw new AbandonedCartValidationError();

  const subtotal = boundedMoney(requiredValue(body, "subtotal"));
  const deliveryRate = boundedMoney(requiredValue(body, "deliveryRate"));
  const total = boundedMoney(requiredValue(body, "total"));
  if (Math.abs(total - (subtotal + deliveryRate)) > 0.001) throw new AbandonedCartValidationError();

  return {
    draftKey: draftKey.toLowerCase(),
    source: normalizedSource,
    sourcePath,
    customerName: optionalText(optionalValue(body, "customerName"), 120),
    phone,
    address: optionalText(optionalValue(body, "address"), 500),
    items: parseItems(requiredValue(body, "items")),
    subtotal,
    deliveryRate,
    total,
    campaign: parseCampaign(optionalValue(body, "campaign")),
  };
}

export async function processAbandonedCartCapture(
  body: unknown,
  dependencies: AbandonedCartServiceDependencies = {},
) {
  const capture = parseAbandonedCartCapture(body);
  const merchantSuiteUrl = (dependencies.merchantSuiteUrl
    ?? (process.env.NODE_ENV === "production"
      ? "https://admin.mangolover.com.bd"
      : process.env.MERCHANT_SUITE_URL)
    ?? "").replace(/\/$/, "");
  const apiKey = dependencies.apiKey ?? process.env.CUSTOM_ORDERS_API_KEY ?? "";
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const forwardedClientIp = typeof dependencies.forwardedClientIp === "string"
    && isIP(dependencies.forwardedClientIp)
    ? dependencies.forwardedClientIp
    : undefined;

  try {
    if (!merchantSuiteUrl || !apiKey) throw new Error("Missing Merchant-Suite configuration");
    const response = await fetchImpl(`${merchantSuiteUrl}/api/custom-orders/abandoned-checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        ...(forwardedClientIp ? { "x-storefront-client-ip": forwardedClientIp } : {}),
      },
      body: JSON.stringify(capture),
      signal: (dependencies.timeoutSignal ?? (() => AbortSignal.timeout(CAPTURE_TIMEOUT_MS)))(),
    });
    if (!response.ok) throw new Error("Merchant-Suite rejected abandoned cart capture");
  } catch {
    throw new AbandonedCartUpstreamError();
  }
}

function getVercelClientIp(req: IncomingMessage) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const clientIp = value?.split(",")[0]?.trim();
  return clientIp && isIP(clientIp) ? clientIp : undefined;
}

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

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export function createAbandonedCartHandler(dependencies: CaptureHandlerDependencies = {}) {
  const processCapture = dependencies.processCapture
    ?? ((capture: AbandonedCartCapture, context?: { forwardedClientIp?: string }) => processAbandonedCartCapture(capture, {
      forwardedClientIp: context?.forwardedClientIp,
    }));

  return async function handler(
    req: IncomingMessage & { body?: unknown },
    res: ServerResponse,
  ) {
    if (req.method !== "POST") {
      sendJson(res, 405, { ok: false, message: "Method not allowed" });
      return;
    }

    try {
      const capture = parseAbandonedCartCapture(await readBody(req));
      await processCapture(capture, { forwardedClientIp: getVercelClientIp(req) });
      sendJson(res, 202, { ok: true });
    } catch (error) {
      if (error instanceof RequestBodyError) {
        sendJson(res, error.statusCode, { ok: false, message: "Invalid checkout details" });
        return;
      }
      if (error instanceof AbandonedCartValidationError) {
        sendJson(res, 400, { ok: false, message: "Invalid checkout details" });
        return;
      }
      if (error instanceof AbandonedCartUpstreamError) {
        sendJson(res, 502, { ok: false, message: "Could not save checkout details. Please continue with your order." });
        return;
      }
      sendJson(res, 500, { ok: false, message: "Could not save checkout details. Please continue with your order." });
    }
  };
}

export default createAbandonedCartHandler();
