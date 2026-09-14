import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const productPage = readFileSync(new URL("./product.tsx", import.meta.url), "utf8");
const homeProductCard = readFileSync(new URL("../components/home-product-card.tsx", import.meta.url), "utf8");
const cartContext = readFileSync(new URL("../contexts/cart-context.tsx", import.meta.url), "utf8");
const cartDrawer = readFileSync(new URL("../components/cart-drawer.tsx", import.meta.url), "utf8");
const orderDialog = readFileSync(new URL("../components/order-dialog.tsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const campaignCheckouts = [
  readFileSync(new URL("../features/sundarbans-honey/honey-checkout.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("../features/kalojira-mixed/kalojira-checkout.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("../features/honey-nut/honey-nut-checkout.tsx", import.meta.url), "utf8"),
];
const campaignThankYouPages = [
  readFileSync(new URL("./sundarbans-honey-thank-you.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("./kalojira-mixed-thank-you.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("./honey-nut-thank-you.tsx", import.meta.url), "utf8"),
];

test("product page sends view_item and direct checkout item metadata", () => {
  assert.match(productPage, /trackGoogleEcommerceEvent\("view_item"/);
  assert.match(productPage, /analyticsItems: \[\{ \.\.\.productAnalyticsItem, quantity \}\]/);
});

test("cart add sends add_to_cart with selected variant metadata", () => {
  assert.match(cartContext, /trackGoogleEcommerceEvent\("add_to_cart"/);
  assert.match(cartContext, /analyticsItem\?: GoogleAnalyticsItem/);
});

test("homepage add to cart passes real product metadata into cart analytics", () => {
  assert.match(homeProductCard, /toGoogleAnalyticsItem/);
  assert.match(homeProductCard, /analyticsItem: toGoogleAnalyticsItem\(\{/);
  assert.match(homeProductCard, /id: product\.id \?\? product\.slug/);
});

test("cart checkout preserves every item for checkout and purchase analytics", () => {
  assert.match(cartDrawer, /analyticsItems: items\.map/);
  assert.match(cartDrawer, /toGoogleAnalyticsItem/);
});

test("order dialog sends begin_checkout and purchase after a successful order", () => {
  assert.match(orderDialog, /trackGoogleEcommerceEvent\("begin_checkout"/);
  assert.match(orderDialog, /trackGoogleEcommerceEvent\("purchase"/);
  assert.match(orderDialog, /transactionId: result\.orderRef \|\| result\.order_id/);
});

test("ecommerce callers do not initialize direct Meta tracking", () => {
  for (const source of [app, productPage, cartContext, orderDialog]) {
    assert.doesNotMatch(source, /(?:@\/lib\/meta|initMetaPixel|trackMetaEvent|createEventId|metaEventId)/);
  }
  assert.equal(existsSync(new URL("../lib/meta.ts", import.meta.url)), false);
});

test("direct checkout analytics preserve selected quantity and unit price", () => {
  assert.match(productPage, /analyticsItems: \[\{ \.\.\.productAnalyticsItem, quantity \}\]/);
  assert.match(orderDialog, /const bundleQuantity = bundle\?\.quantity \?\? 1/);
  assert.match(orderDialog, /price: bundle\.unitPrice \?\? bundle\.price \/ \(bundle\.quantity \?\? 1\)/);
  assert.match(orderDialog, /quantity: bundle\.quantity \?\? 1/);
});

test("all campaign landing pages send ecommerce view, checkout, selection, and purchase events", () => {
  for (const checkout of campaignCheckouts) {
    assert.match(checkout, /trackGoogleEcommerceEvent\("view_item"/);
    assert.match(checkout, /trackGoogleEcommerceEvent\("begin_checkout"/);
    assert.match(checkout, /trackGoogleEcommerceEvent\("select_item"/);
  }

  for (const thankYouPage of campaignThankYouPages) {
    assert.match(thankYouPage, /trackGoogleEcommerceEvent\("purchase"/);
  }
});
