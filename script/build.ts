import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import {
  createSitemapXml,
  getStaticSeoProducts,
  injectProductMeta,
  resolveStorefrontBuildCatalog,
  type BuildProduct,
} from "./storefront-seo-artifacts";
import { getAngonaloyCatalogApiBase } from "../shared/angonaloy-catalog-api.ts";

const configuredMerchantSuiteUrl = (process.env.VITE_MERCHANT_SUITE_URL ?? "").replace(/\/$/, "");
const MERCHANT_SUITE_URL = configuredMerchantSuiteUrl
  || (process.env.NODE_ENV === "production" ? "https://angonaloy-commerceos.vercel.app" : "");
if (!MERCHANT_SUITE_URL) {
  throw new Error("VITE_MERCHANT_SUITE_URL environment variable is not set");
}
const storefrontProductsUrl = `${getAngonaloyCatalogApiBase(MERCHANT_SUITE_URL)}/products`;
const generatedProductsFile = "client/src/lib/generated-storefront-products.ts";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function readFallbackProducts(): Promise<BuildProduct[]> {
  const source = await readFile(generatedProductsFile, "utf-8");
  const match = source.match(/export const generatedStorefrontProducts[^=]*=\s*(\[[\s\S]*\]);?\s*$/);
  if (!match) return [];

  const products = JSON.parse(match[1]);
  return Array.isArray(products) ? products as BuildProduct[] : [];
}

async function generateStorefrontProducts() {
  console.log("fetching storefront products...");
  const catalog = await resolveStorefrontBuildCatalog({
    storefrontProductsUrl,
    production: process.env.NODE_ENV === "production",
    readFallbackProducts,
  });

  if (catalog.source === "live") {
    const source = `import type { StorefrontProduct } from "./storefront-products";\n\nexport const generatedStorefrontProducts: StorefrontProduct[] = ${JSON.stringify(catalog.products, null, 2)};\n`;
    await writeFile(generatedProductsFile, source);
  } else {
    console.warn("Could not refresh generated storefront products. Using last generated data.");
  }

  return catalog.products;
}

async function buildAll() {
  const products = getStaticSeoProducts(await generateStorefrontProducts());
  const slugs = [...new Set(products.map((p) => p.slug).filter(Boolean))];

  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("creating product route fallbacks...");
  const baseHtml = await readFile("dist/public/index.html", "utf-8");
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  await Promise.all(
    slugs.map(async (slug) => {
      const routeDir = `dist/public/product/${encodeURIComponent(slug)}`;
      await mkdir(routeDir, { recursive: true });
      const product = bySlug.get(slug);
      const html = product ? injectProductMeta(baseHtml, product) : baseHtml;
      await writeFile(`${routeDir}/index.html`, html);
    }),
  );

  console.log("regenerating sitemap...");
  await writeFile("dist/public/sitemap.xml", createSitemapXml(products));

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
