export type GoogleEcommerceEventName =
  | "view_item"
  | "select_item"
  | "add_to_cart"
  | "begin_checkout"
  | "purchase";

export type GoogleAnalyticsItem = {
  item_id: string;
  item_name: string;
  item_brand: "Mango Lover BD";
  item_category: string;
  item_variant: string;
  item_list_name: string;
  item_list_id: string;
  price: number;
  discount: number;
  index: number;
  quantity: number;
};

type GoogleAnalyticsItemInput = {
  id: string | number | null | undefined;
  name: string;
  category?: string | null;
  variant?: string | null;
  price: string | number | null | undefined;
  quantity?: number | null;
};

type GoogleEcommerceBaseInput = {
  event: GoogleEcommerceEventName;
  pageType: "product" | "checkout" | "thank_you";
  title?: string;
  url?: string;
  language?: string;
  value: number;
  items: GoogleAnalyticsItem[];
  transactionId?: string | null;
  affiliation?: string;
  tax?: number;
  shipping?: number;
  coupon?: string;
  customer?: { name: string; phone: string; address: string };
};

export type GoogleEcommerceData = {
  currency: "BDT";
  value: number;
  items: GoogleAnalyticsItem[];
  transaction_id: string;
  affiliation: string;
  tax: number;
  shipping: number;
  coupon: string;
  customer?: { name: string; phone: string; address: string };
};

export type GoogleEcommercePayload = {
  event: GoogleEcommerceEventName;
  page_type: GoogleEcommerceBaseInput["pageType"];
  page_title: string;
  page_url: string;
  page_path: string;
  page_language: string;
  logged_in: false;
  customer_id: null;
  ecommerce: GoogleEcommerceData;
};

export type GoogleAnalyticsWindow = {
  dataLayer?: unknown[];
  location?: Pick<Location, "href" | "pathname"> | URL;
  document?: {
    title?: string;
    documentElement?: { lang?: string };
  };
};

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function parseCurrencyAmount(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const amount = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function getSafePageLocation(url: string) {
  try {
    const location = new URL(url);
    if (location.protocol !== "http:" && location.protocol !== "https:") {
      return { pageUrl: "", pagePath: "" };
    }

    return {
      pageUrl: `${location.origin}${location.pathname}`,
      pagePath: location.pathname,
    };
  } catch {
    return { pageUrl: "", pagePath: "" };
  }
}

export function toGoogleAnalyticsItem(input: GoogleAnalyticsItemInput): GoogleAnalyticsItem {
  const variant = input.variant?.trim() || "";
  const category = input.category?.trim() || "";
  const item: GoogleAnalyticsItem = {
    item_id: String(input.id || input.name),
    item_name: variant ? `${input.name} — ${variant}` : input.name,
    item_brand: "Mango Lover BD",
    item_category: category,
    item_variant: variant,
    item_list_name: "",
    item_list_id: "",
    price: roundMoney(parseCurrencyAmount(input.price)),
    discount: 0,
    index: 0,
    quantity: input.quantity && input.quantity > 0 ? input.quantity : 1,
  };

  return item;
}

export function buildGoogleEcommercePayload(input: GoogleEcommerceBaseInput): GoogleEcommercePayload {
  const { pageUrl, pagePath } = getSafePageLocation(input.url || "");

  const ecommerce: GoogleEcommerceData = {
    currency: "BDT",
    value: roundMoney(input.value),
    items: input.items,
    transaction_id: input.transactionId || "",
    affiliation: input.affiliation ?? "",
    tax: typeof input.tax === "number" ? roundMoney(input.tax) : 0,
    shipping: typeof input.shipping === "number" ? roundMoney(input.shipping) : 0,
    coupon: typeof input.coupon === "string" ? input.coupon : "",
  };

  if (input.customer) ecommerce.customer = input.customer;

  const payload: GoogleEcommercePayload = {
    event: input.event,
    page_type: input.pageType,
    page_title: input.title || "",
    page_url: pageUrl,
    page_path: pagePath,
    page_language: input.language || "en",
    logged_in: false,
    customer_id: null,
    ecommerce,
  };

  return payload;
}

function getBrowserTarget(target?: GoogleAnalyticsWindow): GoogleAnalyticsWindow | null {
  if (target) return target;
  return typeof window === "undefined" ? null : window;
}

function getCurrentUrl(target: GoogleAnalyticsWindow) {
  return target.location?.href || "";
}

function getCurrentLanguage(target: GoogleAnalyticsWindow) {
  return target.document?.documentElement?.lang || "en";
}

export function trackGoogleEcommerceEvent(
  event: GoogleEcommerceEventName,
  input: Omit<GoogleEcommerceBaseInput, "event" | "title" | "url" | "language"> &
    Partial<Pick<GoogleEcommerceBaseInput, "title" | "url" | "language">>,
  target?: GoogleAnalyticsWindow,
) {
  const browserTarget = getBrowserTarget(target);
  if (!browserTarget) return null;

  const payload = buildGoogleEcommercePayload({
    ...input,
    event,
    title: input.title ?? browserTarget.document?.title ?? "",
    url: input.url ?? getCurrentUrl(browserTarget),
    language: input.language ?? getCurrentLanguage(browserTarget),
  });

  browserTarget.dataLayer = browserTarget.dataLayer || [];
  browserTarget.dataLayer.push(payload);

  return payload;
}
