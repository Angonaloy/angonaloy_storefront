export const ABANDONED_CART_SOURCE_PATHS = {
  storefront: "/checkout",
  sundarbans_honey: "/step/sundarbans-natural-honey",
  kalojira_mixed: "/step/kalojira-mixed",
  honey_nut: "/step/honey-nut",
} as const;

export type AbandonedCartSource = keyof typeof ABANDONED_CART_SOURCE_PATHS;

export type AbandonedCartCampaign = Partial<Record<
  "utmSource" | "utmMedium" | "utmCampaign" | "utmContent" | "utmTerm",
  string
>>;

export type AbandonedCartItem = {
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
};

export type AbandonedCartSnapshot = {
  customerName?: string;
  phone: string;
  address?: string;
  items: AbandonedCartItem[];
  subtotal: number;
  deliveryRate: number;
  total: number;
  campaign?: AbandonedCartCampaign;
};

export type AbandonedCartCapturePayload = AbandonedCartSnapshot & {
  draftKey: string;
  source: AbandonedCartSource;
  sourcePath: string;
  campaign: AbandonedCartCampaign;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type AbandonedCartCaptureOptions = {
  source: AbandonedCartSource;
  storage?: StorageLike;
  fetchImpl?: FetchLike;
  createDraftKey?: () => string | null;
  debounceMs?: number;
  timeoutMs?: number;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_MONEY = 10_000_000;
const DEFAULT_DEBOUNCE_MS = 500;
const DEFAULT_TIMEOUT_MS = 3_500;
const DRAFT_STORAGE_PREFIX = "mangolover-abandoned-cart-v1:";
const memoryDraftKeys = new Map<AbandonedCartSource, string>();

const CAMPAIGN_QUERY_KEYS: Array<[string, keyof AbandonedCartCampaign]> = [
  ["utm_source", "utmSource"],
  ["utm_medium", "utmMedium"],
  ["utm_campaign", "utmCampaign"],
  ["utm_content", "utmContent"],
  ["utm_term", "utmTerm"],
];

function isDraftKey(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function normalizedOptionalText(value: string | undefined, maxLength: number) {
  if (value === undefined) return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function isBoundedOptionalText(value: string | undefined, maxLength: number) {
  const normalized = normalizedOptionalText(value, maxLength);
  return normalized === undefined || normalized.length <= maxLength;
}

function isBoundedMoney(value: number) {
  return Number.isFinite(value)
    && value >= 0
    && value <= MAX_MONEY
    && Math.round(value * 100) / 100 === value;
}

function validBrowserPhone(phone: string) {
  return /^01\d{9}$/.test(phone.trim());
}

function validSnapshot(snapshot: AbandonedCartSnapshot) {
  if (!validBrowserPhone(snapshot.phone)
    || !isBoundedOptionalText(snapshot.customerName, 120)
    || !isBoundedOptionalText(snapshot.address, 500)
    || !Array.isArray(snapshot.items)
    || snapshot.items.length === 0
    || snapshot.items.length > 20
    || !isBoundedMoney(snapshot.subtotal)
    || !isBoundedMoney(snapshot.deliveryRate)
    || !isBoundedMoney(snapshot.total)
    || Math.abs(snapshot.total - (snapshot.subtotal + snapshot.deliveryRate)) > 0.001) {
    return false;
  }

  return snapshot.items.every((item) => item.productName.trim().length > 0
    && item.productName.trim().length <= 200
    && isBoundedOptionalText(item.variantName, 160)
    && Number.isSafeInteger(item.quantity)
    && item.quantity >= 1
    && item.quantity <= 100
    && isBoundedMoney(item.unitPrice));
}

function normalizeCampaign(campaign: AbandonedCartCampaign | undefined): AbandonedCartCampaign {
  const normalized: AbandonedCartCampaign = {};
  for (const key of ["utmSource", "utmMedium", "utmCampaign", "utmContent", "utmTerm"] as const) {
    const value = campaign?.[key];
    const text = typeof value === "string" ? normalizedOptionalText(value, 120) : undefined;
    if (text && text.length <= 120) normalized[key] = text;
  }
  return normalized;
}

function createBrowserDraftKey() {
  const browserCrypto = globalThis.crypto;
  if (typeof browserCrypto?.randomUUID === "function") {
    const key = browserCrypto.randomUUID();
    return isDraftKey(key) ? key.toLowerCase() : null;
  }
  if (typeof browserCrypto?.getRandomValues !== "function") return null;

  const bytes = browserCrypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function readStoredDraftKey(source: AbandonedCartSource, storage: StorageLike | undefined) {
  const storageKey = `${DRAFT_STORAGE_PREFIX}${source}`;
  try {
    const stored = storage?.getItem(storageKey);
    if (isDraftKey(stored)) return stored.toLowerCase();
  } catch {
    // Storage can be unavailable in privacy modes.
  }
  const inMemory = memoryDraftKeys.get(source);
  return isDraftKey(inMemory) ? inMemory : null;
}

function persistDraftKey(source: AbandonedCartSource, storage: StorageLike | undefined, draftKey: string) {
  memoryDraftKeys.set(source, draftKey);
  try {
    storage?.setItem(`${DRAFT_STORAGE_PREFIX}${source}`, draftKey);
  } catch {
    // The memory fallback keeps this checkout interaction idempotent.
  }
}

function removeDraftKey(source: AbandonedCartSource, storage: StorageLike | undefined) {
  memoryDraftKeys.delete(source);
  try {
    storage?.removeItem(`${DRAFT_STORAGE_PREFIX}${source}`);
  } catch {
    // Clearing remains best-effort when browser storage is unavailable.
  }
}

function browserFetch(): FetchLike | undefined {
  return typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : undefined;
}

export class AbandonedCartCapture {
  private draftKeyValue: string | null;
  private latestPayload: AbandonedCartCapturePayload | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inFlight: Promise<boolean> | null = null;
  private inFlightPayload: AbandonedCartCapturePayload | null = null;
  private resendAfterFlight = false;
  private failed = false;

  constructor(private readonly options: AbandonedCartCaptureOptions) {
    this.draftKeyValue = readStoredDraftKey(options.source, options.storage);
  }

  get draftKey() {
    return this.draftKeyValue;
  }

  capture(snapshot: AbandonedCartSnapshot) {
    if (!validSnapshot(snapshot)) return null;
    const draftKey = this.ensureDraftKey();
    if (!draftKey) return null;

    this.latestPayload = {
      customerName: normalizedOptionalText(snapshot.customerName, 120),
      phone: snapshot.phone.trim(),
      address: normalizedOptionalText(snapshot.address, 500),
      items: snapshot.items.map((item) => ({
        productName: item.productName.trim(),
        variantName: normalizedOptionalText(item.variantName, 160),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      subtotal: snapshot.subtotal,
      deliveryRate: snapshot.deliveryRate,
      total: snapshot.total,
      campaign: normalizeCampaign(snapshot.campaign),
      draftKey,
      source: this.options.source,
      sourcePath: ABANDONED_CART_SOURCE_PATHS[this.options.source],
    };
    this.schedule();
    return draftKey;
  }

  async flush(snapshot?: AbandonedCartSnapshot) {
    const draftKey = snapshot ? this.capture(snapshot) : this.draftKeyValue;
    if (!this.latestPayload) return draftKey;
    this.clearTimer();
    await this.send();
    return draftKey;
  }

  retry() {
    if (!this.failed || !this.latestPayload) return;
    this.schedule(0);
  }

  clear() {
    this.clearTimer();
    this.latestPayload = null;
    this.failed = false;
    this.resendAfterFlight = false;
    this.draftKeyValue = null;
    removeDraftKey(this.options.source, this.options.storage);
  }

  async finalize() {
    this.clearTimer();
    const payload = this.latestPayload;
    const inFlight = this.inFlight;
    const inFlightPayload = this.inFlightPayload;
    this.clear();

    const inFlightSucceeded = inFlight ? await inFlight : false;
    if (payload && (payload !== inFlightPayload || !inFlightSucceeded)) {
      await this.post(payload);
    }
  }

  dispose() {
    this.clearTimer();
  }

  private ensureDraftKey() {
    if (this.draftKeyValue) return this.draftKeyValue;
    const generated = this.options.createDraftKey?.() ?? createBrowserDraftKey();
    if (!isDraftKey(generated)) return null;
    this.draftKeyValue = generated.toLowerCase();
    persistDraftKey(this.options.source, this.options.storage, this.draftKeyValue);
    return this.draftKeyValue;
  }

  private schedule(delay = this.options.debounceMs ?? DEFAULT_DEBOUNCE_MS) {
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.send();
    }, delay);
  }

  private clearTimer() {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = null;
  }

  private send(): Promise<boolean> {
    if (!this.latestPayload) return Promise.resolve(true);
    if (this.inFlight) {
      this.resendAfterFlight = true;
      return this.inFlight;
    }

    const payload = this.latestPayload;
    this.inFlightPayload = payload;
    this.inFlight = this.post(payload)
      .then((ok) => {
        this.failed = !ok;
        return ok;
      })
      .finally(() => {
        this.inFlight = null;
        this.inFlightPayload = null;
        if (this.resendAfterFlight && this.latestPayload) {
          this.resendAfterFlight = false;
          this.schedule(0);
        }
      });
    return this.inFlight;
  }

  private async post(payload: AbandonedCartCapturePayload) {
    const fetchImpl = this.options.fetchImpl ?? browserFetch();
    if (!fetchImpl) return false;

    const controller = typeof AbortController === "undefined" ? null : new AbortController();
    const timeout = controller
      ? setTimeout(() => controller.abort(), this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
      : null;
    try {
      const response = await fetchImpl("/api/abandoned-carts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
        keepalive: true,
        ...(controller ? { signal: controller.signal } : {}),
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}

export function createAbandonedCartCapture(options: AbandonedCartCaptureOptions) {
  return new AbandonedCartCapture(options);
}

export function readAbandonedCartCampaign(search: string): AbandonedCartCampaign {
  const params = new URLSearchParams(search);
  const campaign: AbandonedCartCampaign = {};
  for (const [queryKey, campaignKey] of CAMPAIGN_QUERY_KEYS) {
    const value = normalizedOptionalText(params.get(queryKey) ?? undefined, 120);
    if (value && value.length <= 120) campaign[campaignKey] = value;
  }
  return campaign;
}
