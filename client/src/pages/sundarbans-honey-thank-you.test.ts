import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagePath = new URL("./sundarbans-honey-thank-you.tsx", import.meta.url);
const pageSource = readFileSync(pagePath, "utf8");

test("direct visits never render a success confirmation and return through a wouter link", () => {
  assert.match(pageSource, /readHoneyOrderConfirmation/);
  assert.match(pageSource, /if \(!confirmation\)/);
  assert.match(pageSource, /কোনো সাম্প্রতিক অর্ডারের তথ্য পাওয়া যায়নি।/);
  assert.match(pageSource, /<Link href="\/step\/sundarbans-natural-honey"/);
  assert.doesNotMatch(pageSource, /(?:Date\.now|Math\.random|crypto\.randomUUID)/);
  assert.doesNotMatch(pageSource, /localStorage/);
});

test("confirmed visits display only the safe canonical order summary", () => {
  assert.match(pageSource, /আপনার অর্ডারটি গ্রহণ করা হয়েছে/);
  assert.match(pageSource, /অর্ডার নম্বর:/);
  assert.match(pageSource, /confirmation\.orderRef/);
  assert.match(pageSource, />প্যাক</);
  assert.match(pageSource, /confirmation\.variantLabel/);
  assert.match(pageSource, />পরিমাণ</);
  assert.match(pageSource, /confirmation\.quantity/);
  assert.match(pageSource, />সাবটোটাল</);
  assert.match(pageSource, /confirmation\.subtotal/);
  assert.match(pageSource, />ডেলিভারি</);
  assert.match(pageSource, /confirmation\.deliveryCharge/);
  assert.match(pageSource, />মোট</);
  assert.match(pageSource, /confirmation\.total/);
  assert.match(pageSource, /অর্ডার নিশ্চিত করতে আমাদের টিম আপনাকে ফোন করতে পারে।/);
  const summaryStart = pageSource.indexOf("<dl");
  const summaryEnd = pageSource.indexOf("</dl>");
  assert.ok(summaryStart >= 0 && summaryEnd > summaryStart, "order summary block must exist");
  assert.doesNotMatch(
    pageSource.slice(summaryStart, summaryEnd),
    /confirmation\.(?:customerName|phone|address|district|upazila)/,
  );
});

test("a canonical confirmation is consumed and emits one deduped GA4 purchase", () => {
  assert.match(pageSource, /clearHoneyOrderConfirmation\(storage\)/);
  assert.match(
    pageSource,
    /if \(!markPurchaseTracked\(storage, confirmation\.orderRef\)\) return;/,
  );

  const markerCall = pageSource.indexOf("markPurchaseTracked(storage, confirmation.orderRef)");
  const purchaseCall = pageSource.indexOf('trackGoogleEcommerceEvent("purchase"');
  assert.ok(markerCall >= 0 && markerCall < purchaseCall, "dedupe marker must be written before purchase");

  assert.match(pageSource, /pageType: "thank_you"/);
  assert.match(pageSource, /transactionId: confirmation\.orderRef/);
  assert.match(pageSource, /value: confirmation\.total/);
  assert.match(pageSource, /shipping: confirmation\.deliveryCharge/);
  assert.match(pageSource, /items: \[toGoogleAnalyticsItem\(\{/);
  assert.match(pageSource, /price: confirmation\.unitPrice/);
  assert.match(pageSource, /quantity: confirmation\.quantity/);
  assert.match(pageSource, /customer: \{/);
  assert.match(pageSource, /name: confirmation\.customerName/);
  assert.match(pageSource, /phone: confirmation\.phone/);
  assert.match(pageSource, /address: confirmation\.address/);
});

test("support is available by phone and WhatsApp without page-owned metadata or Meta", () => {
  assert.match(pageSource, /href="tel:\+8801819502705"/);
  assert.match(pageSource, /href=\{WHATSAPP_HREF\}/);
  assert.match(pageSource, /https:\/\/wa\.me\/8801819502705/);
  assert.doesNotMatch(pageSource, /document\.(?:title|head)/);
  assert.doesNotMatch(pageSource, /meta\[name=["']robots/);
  assert.doesNotMatch(pageSource, /(?:fbq|trackMetaEvent|initMetaPixel)/);
});
