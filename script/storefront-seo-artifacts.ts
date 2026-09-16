export type BuildProduct = {
  slug: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  price?: string | number | null;
  [key: string]: unknown;
};

export type BuildCatalogResult = {
  products: BuildProduct[];
  source: "live" | "fallback";
};

const SITE_URL = "https://angonaloy.shop";
const DEFAULT_DESCRIPTION = "Angonaloy-আঙ্গনালয়. Fresh, authentic products delivered across Bangladesh.";
const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph.jpg`;
const PRODUCT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LEGACY_GONE_PRODUCT_SLUGS = new Set([
  "stepprs-massage-insoles",
  "massage-insoles",
  "4-in-1-makeup-pen",
  "bordeaux",
  "plum-veil",
  "rosy-bloom",
  "mauve-nude",
]);

function isBuildProduct(value: unknown): value is BuildProduct {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const product = value as Record<string, unknown>;
  return typeof product.slug === "string" && product.slug.trim().length > 0
    && typeof product.name === "string" && product.name.trim().length > 0;
}

function isStaticSeoProduct(value: unknown): value is BuildProduct {
  if (!isBuildProduct(value)) {
    return false;
  }

  return PRODUCT_SLUG_PATTERN.test(value.slug)
    && !LEGACY_GONE_PRODUCT_SLUGS.has(value.slug);
}

function parseBuildProducts(value: unknown): BuildProduct[] {
  if (!Array.isArray(value) || !value.every(isStaticSeoProduct)) {
    throw new Error("invalid catalog response");
  }

  return value;
}

export function getStaticSeoProducts(products: BuildProduct[]) {
  return products.filter(isStaticSeoProduct);
}

function safeCatalogFailureReason(error: unknown) {
  if (error instanceof Error && /^Merchant Suite returned \d{3}$/.test(error.message)) {
    return error.message;
  }

  if (error instanceof Error && error.message === "invalid catalog response") {
    return error.message;
  }

  return "request failed";
}

export async function resolveStorefrontBuildCatalog(options: {
  storefrontProductsUrl: string;
  production: boolean;
  fetchImpl?: typeof fetch;
  readFallbackProducts: () => Promise<BuildProduct[]>;
}): Promise<BuildCatalogResult> {
  try {
    const response = await (options.fetchImpl ?? fetch)(options.storefrontProductsUrl, {
      headers: { "ngrok-skip-browser-warning": "true" },
    });

    if (!response.ok) {
      throw new Error(`Merchant Suite returned ${response.status}`);
    }

    const body = await response.json() as { products?: unknown };
    return { products: parseBuildProducts(body.products), source: "live" };
  } catch (error) {
    if (options.production) {
      throw new Error(`Could not refresh storefront SEO catalog: ${safeCatalogFailureReason(error)}`);
    }

    try {
      const fallbackProducts = await options.readFallbackProducts();
      return {
        products: Array.isArray(fallbackProducts) && fallbackProducts.every(isBuildProduct)
          ? fallbackProducts
          : [],
        source: "fallback",
      };
    } catch {
      return { products: [], source: "fallback" };
    }
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeXml(value: string) {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

function safeProductImage(value: unknown) {
  if (typeof value !== "string") {
    return DEFAULT_OG_IMAGE;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : DEFAULT_OG_IMAGE;
  } catch {
    return DEFAULT_OG_IMAGE;
  }
}

function replaceHeadTag(html: string, pattern: RegExp, replacement: string) {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }

  return html.replace("</head>", `${replacement}\n</head>`);
}

function serializeJsonForScript(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function getCatalogPrice(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? String(value) : null;
  }

  if (typeof value === "string" && value.trim()) {
    const price = Number(value);
    return Number.isFinite(price) && price >= 0 ? String(price) : null;
  }

  return null;
}

export function injectProductMeta(baseHtml: string, product: BuildProduct) {
  if (!isStaticSeoProduct(product)) {
    throw new Error("invalid product slug");
  }

  const description = (typeof product.description === "string" && product.description.trim()
    ? product.description
    : DEFAULT_DESCRIPTION).slice(0, 160);
  const title = `${product.name} | Angonaloy-আঙ্গনালয়`;
  const url = `${SITE_URL}/product/${encodeURIComponent(product.slug)}`;
  const image = safeProductImage(product.image_url);
  const price = getCatalogPrice(product.price);

  let html = baseHtml;
  html = replaceHeadTag(html, /<title\b[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = replaceHeadTag(html, /<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i, `<meta name="description" content="${escapeHtml(description)}" />`);
  html = replaceHeadTag(html, /<meta\b(?=[^>]*\bproperty=["']og:title["'])[^>]*>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = replaceHeadTag(html, /<meta\b(?=[^>]*\bproperty=["']og:description["'])[^>]*>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = replaceHeadTag(html, /<meta\b(?=[^>]*\bproperty=["']og:type["'])[^>]*>/i, '<meta property="og:type" content="product" />');
  html = replaceHeadTag(html, /<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*>/i, `<meta property="og:url" content="${escapeHtml(url)}" />`);
  html = replaceHeadTag(html, /<meta\b(?=[^>]*\bproperty=["']og:image["'])[^>]*>/i, `<meta property="og:image" content="${escapeHtml(image)}" />`);
  html = replaceHeadTag(html, /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i, `<link rel="canonical" data-seo="canonical" href="${escapeHtml(url)}" />`);

  const jsonLd = serializeJsonForScript({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image,
    url,
    brand: { "@type": "Brand", name: "Angonaloy" },
    ...(price
      ? {
        offers: {
          "@type": "Offer",
          priceCurrency: "BDT",
          price,
          url,
        },
      }
      : {}),
  });

  return html.replace("</head>", `<script type="application/ld+json" data-seo="product">${jsonLd}</script>\n</head>`);
}

export function createSitemapXml(products: BuildProduct[]) {
  const slugs = [...new Set(getStaticSeoProducts(products)
    .map((product) => product.slug))];
  const urls = [
    { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${SITE_URL}/products`, changefreq: "daily", priority: "0.9" },
    { loc: `${SITE_URL}/booking`, changefreq: "monthly", priority: "0.5" },
    ...slugs.map((slug) => ({
      loc: `${SITE_URL}/product/${encodeURIComponent(slug)}`,
      changefreq: "weekly",
      priority: "0.8",
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${escapeXml(url.loc)}</loc><changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>`)
    .join("\n")}\n</urlset>\n`;
}
