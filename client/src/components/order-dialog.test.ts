import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const orderDialogSource = readFileSync(new URL("./order-dialog.tsx", import.meta.url), "utf8");

test("requires a paid delivery option to be selected", () => {
  assert.match(orderDialogSource, /useState<number \| null>\(null\)/);
  assert.match(orderDialogSource, /setDeliveryCharge\(null\)/);
  assert.match(orderDialogSource, /if \(deliveryCharge === null\)/);
});

test("aligns delivery and payment choices into three desktop columns without changing mobile stacking", () => {
  assert.match(orderDialogSource, /className="grid gap-4 md:grid-cols-3 md:gap-2"/);
  assert.match(orderDialogSource, /className="grid content-start gap-2 md:col-span-2"/);
  assert.match(orderDialogSource, /className="grid gap-2 max-md:gap-1\.5 md:grid-cols-2"/);
  assert.match(orderDialogSource, /className="grid content-start gap-2"[\s\S]*?Payment Method - পেমেন্ট পদ্ধতি/);
  assert.match(orderDialogSource, /className="grid gap-2 md:h-full"/);
});
