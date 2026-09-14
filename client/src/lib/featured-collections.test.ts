import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FEATURED_COLLECTIONS,
  TOP_SELLING_COLLECTION,
  getCollection,
  getFeaturedCollection,
  getTopSellingProducts,
  getProductsForCollection,
  getVisibleFeaturedCollections,
} from "./featured-collections";

test("defines the nine homepage collections", () => {
  assert.deepEqual(FEATURED_COLLECTIONS.map(({ slug }) => slug), [
    "fresh-mango",
    "homemade",
    "functional-food",
    "honey",
    "oil-and-ghee",
    "jaggery",
    "semai",
    "dates",
    "nuts-and-seeds",
  ]);
});

test("assigns every current product to exactly one collection", () => {
  const assignments = FEATURED_COLLECTIONS.flatMap((collection) =>
    collection.productSlugs.map((productSlug) => ({ collection: collection.slug, productSlug })),
  );
  const productSlugs = [
    "litchi-flower-honey",
    "mustard-oil",
    "seed-nut-mix",
    "seed-mixed",
    "beetroot-powder",
    "kalojira-mixed",
    "honey-nut",
    "chia-seed",
    "katimon-mango",
    "pure-ghee",
    "sundarbans-natural-honey",
    "black-seed-flower-honey",
    "granulated-sugarcane-jaggery",
    "sugarcane-juice-powder",
    "amsotto-pickle",
    "lachcha-semai",
  ];

  assert.equal(new Set(assignments.map(({ productSlug }) => productSlug)).size, assignments.length);
  assert.deepEqual(assignments.map(({ productSlug }) => productSlug).sort(), productSlugs.sort());
});

test("assigns Honey Nut to Nuts & Seeds instead of Honey", () => {
  const honey = getFeaturedCollection("honey");
  const nutsAndSeeds = getFeaturedCollection("nuts-and-seeds");

  assert.ok(honey);
  assert.ok(nutsAndSeeds);
  assert.equal(honey.productSlugs.includes("honey-nut"), false);
  assert.equal(nutsAndSeeds.productSlugs.includes("honey-nut"), true);
});

test("assigns functional products to Functional Food instead of Homemade", () => {
  const homemade = getFeaturedCollection("homemade");
  const functionalFood = getFeaturedCollection("functional-food");

  assert.ok(homemade);
  assert.ok(functionalFood);
  assert.equal(functionalFood.label, "Functional Food-ফাংশনাল ফুড");
  assert.equal(functionalFood.image, "/categories/functional-food-1-320.webp");
  assert.deepEqual(functionalFood.productSlugs, ["kalojira-mixed", "beetroot-powder"]);
  assert.equal(homemade.productSlugs.includes("kalojira-mixed"), false);
  assert.equal(homemade.productSlugs.includes("beetroot-powder"), false);
  assert.deepEqual(
    getVisibleFeaturedCollections([
      { slug: "kalojira-mixed", name: "Kalojira Mixed" },
      { slug: "beetroot-powder", name: "Beetroot Powder" },
    ]).map(({ slug }) => slug),
    ["functional-food"],
  );
});

test("assigns both sugarcane products to the visible Jaggery category", () => {
  const homemade = getFeaturedCollection("homemade");
  const jaggery = getFeaturedCollection("jaggery");

  assert.ok(homemade);
  assert.ok(jaggery);
  assert.equal(homemade.productSlugs.includes("sugarcane-juice-powder"), false);
  assert.deepEqual(jaggery.productSlugs, ["sugarcane-juice-powder", "granulated-sugarcane-jaggery"]);
  assert.deepEqual(
    getVisibleFeaturedCollections([
      { slug: "sugarcane-juice-powder", name: "Sugarcane Juice Powder" },
      { slug: "granulated-sugarcane-jaggery", name: "Granulated Sugarcane Jaggery" },
    ]).map(({ slug }) => slug),
    ["jaggery"],
  );
});

test("makes Fresh Mango visible for Katimon Mango", () => {
  const freshMango = getFeaturedCollection("fresh-mango");
  const katimonMango = { slug: "katimon-mango", name: "কাটিমন আম | Katimon Mango" };

  assert.ok(freshMango);
  assert.equal(freshMango.label, "Fresh Mango-ফ্রেশ আম");
  assert.deepEqual(getProductsForCollection([katimonMango], freshMango), [katimonMango]);
  assert.deepEqual(getVisibleFeaturedCollections([katimonMango]).map(({ slug }) => slug), ["fresh-mango"]);
});

test("filters a catalog by assigned slugs and ignores missing products", () => {
  const products = [
    { slug: "honey-nut", name: "Honey Nut" },
    { slug: "missing", name: "Missing" },
    { slug: "pure-ghee", name: "Pure Ghee" },
  ];
  const collection = getFeaturedCollection("nuts-and-seeds");

  assert.deepEqual(getProductsForCollection(products, collection!), [products[0]]);
});

test("returns no assigned products for empty collections", () => {
  const collection = getFeaturedCollection("jaggery");
  assert.deepEqual(getProductsForCollection([], collection!), []);
});

test("hides collections with no matching products without removing their definitions", () => {
  const products = [
    { slug: "honey-nut", name: "Honey Nut" },
    { slug: "lachcha-semai", name: "Lachcha Semai" },
  ];

  assert.deepEqual(
    getVisibleFeaturedCollections(products).map(({ slug }) => slug),
    ["semai", "nuts-and-seeds"],
  );
  assert.ok(getFeaturedCollection("jaggery"));
});

test("orders Top Selling Products with the three hero products first", () => {
  assert.equal(TOP_SELLING_COLLECTION.slug, "top-selling-products");
  assert.equal(TOP_SELLING_COLLECTION.label, "Top Selling Products - সেরা বিক্রিত পণ্য");

  const products = [
    { slug: "seed-nut-mix", name: "Seed Nut Mix" },
    { slug: "new-product", name: "New Product" },
    { slug: "black-seed-flower-honey", name: "Black Seed Flower Honey" },
    { slug: "litchi-flower-honey", name: "Litchi Flower Honey" },
    { slug: "honey-nut", name: "Honey Nut" },
    { slug: "seed-mixed", name: "Seed Mixed" },
    { slug: "kalojira-mixed", name: "Kalojira Mixed" },
    { slug: "sundarbans-natural-honey", name: "Sundarbans Natural Honey" },
    { slug: "katimon-mango", name: "Katimon Mango" },
  ];
  assert.deepEqual(
    getTopSellingProducts(products).slice(0, 6).map(({ slug }) => slug),
    [
      "katimon-mango",
      "honey-nut",
      "sundarbans-natural-honey",
      "kalojira-mixed",
      "litchi-flower-honey",
      "black-seed-flower-honey",
      "seed-nut-mix",
    ],
  );
});

test("skips missing top-selling products and appends new catalog products", () => {
  const products = [
    { slug: "new-product", name: "New Product" },
    { slug: "seed-mixed", name: "Seed Mixed" },
    { slug: "honey-nut", name: "Honey Nut" },
    { slug: "kalojira-mixed", name: "Kalojira Mixed" },
  ];

  assert.deepEqual(
    getTopSellingProducts(products).map(({ slug }) => slug),
    ["honey-nut", "kalojira-mixed", "seed-mixed", "new-product"],
  );
});

test("resolves Top Selling Products without exposing it as a Featured Category", () => {
  assert.equal(getCollection("top-selling-products")?.slug, "top-selling-products");
  assert.equal(getFeaturedCollection("top-selling-products"), null);
  assert.doesNotMatch(FEATURED_COLLECTIONS.map(({ slug }) => slug).join(" "), /top-selling-products/);
});
