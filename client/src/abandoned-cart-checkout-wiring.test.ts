import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const checkoutSources = [
  ["main cart checkout", new URL("./components/order-dialog.tsx", import.meta.url), null],
  ["Sundarbans Honey checkout", new URL("./features/sundarbans-honey/honey-checkout.tsx", import.meta.url), "অসম্পূর্ণ চেকআউটের তথ্য"],
  ["Kalojira Mixed checkout", new URL("./features/kalojira-mixed/kalojira-checkout.tsx", import.meta.url), "অসম্পূর্ণ চেকআউটের তথ্য"],
  ["Honey Nut checkout", new URL("./features/honey-nut/honey-nut-checkout.tsx", import.meta.url), "অসম্পূর্ণ চেকআউটের তথ্য"],
] as const;

test("all checkout surfaces capture valid-phone drafts without coupling them to analytics", () => {
  for (const [label, path, notice] of checkoutSources) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /useAbandonedCartCapture/, `${label} should create a capture controller`);
    assert.match(source, /capture\.capture\(/, `${label} should update its checkout draft`);
    assert.match(source, /void capture\.flush\(/, `${label} should flush independently from ordering`);
    assert.match(source, /onBlurCapture=.*flushCapture/, `${label} should save the latest draft on field blur`);
    assert.match(source, /draftKey/, `${label} should pass its opaque draft key with the order`);
    assert.match(source, /capture\.clear\(\)/, `${label} should clear only after a confirmed order`);
    if (notice) {
      assert.match(source, new RegExp(notice), `${label} should explain incomplete-checkout retention`);
    }
  }
});

test("the main checkout does not display the incomplete-checkout retention notice", () => {
  const source = readFileSync(new URL("./components/order-dialog.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /Incomplete checkout details may be saved for up to 30 days/);
});

test("the main checkout finalizes a captured draft when the dialog closes", () => {
  const source = readFileSync(new URL("./components/order-dialog.tsx", import.meta.url), "utf8");

  assert.match(source, /if \(!nextOpen\) \{[\s\S]*?void capture\.finalize\(\)/);
});

test("the main checkout preserves live cart lines for its descriptive capture snapshot", () => {
  const cartDrawerSource = readFileSync(new URL("./components/cart-drawer.tsx", import.meta.url), "utf8");
  const productSource = readFileSync(new URL("./pages/product.tsx", import.meta.url), "utf8");

  assert.match(cartDrawerSource, /captureItems:\s*items\.map/);
  assert.match(productSource, /captureItems:\s*\[\{/);
});
