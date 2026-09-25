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
  assert.match(orderDialogSource, /className="grid content-start gap-2"[\s\S]*?Payment Method - <span className=\{fieldLabelBanglaClass\}>পেমেন্ট পদ্ধতি<\/span>/);
  assert.match(orderDialogSource, /className="grid gap-2 md:h-full"/);
});

test("restyles the order form in the Bloop language while keeping its popup motion", () => {
  // Popup motion and container are unchanged.
  assert.match(orderDialogSource, /initial=\{\{ opacity: 0, scale: 0\.96 \}\}\s*animate=\{\{\s*opacity: 1,\s*scale: 1,\s*transition: \{ duration: 0\.58, ease: \[0\.22, 1, 0\.36, 1\] \},\s*\}\}\s*exit=\{\{\s*opacity: 0,\s*scale: 0\.96,\s*transition: \{ duration: 0\.42, ease: \[0\.22, 1, 0\.36, 1\] \},\s*\}\}/);
  assert.match(orderDialogSource, /<Dialog open=\{open \|\| orderClosing\} onOpenChange=\{resetDialog\}>/);

  // Cream panel, red Bricolage title with Bangla sub-line, dark 44px close square.
  assert.match(orderDialogSource, /md:bg-bloop-cream/);
  assert.match(orderDialogSource, /bg-bloop-cream text-\[#333333\]/);
  assert.match(orderDialogSource, /<DialogTitle className="font-bloop text-\[28px\] font-bold[^"]*text-\[#DB2828\] md:text-\[36px\]">\s*Place Order/);
  assert.match(orderDialogSource, /font-bangla[^"]*">অর্ডার করুন<\/p>/);
  assert.match(orderDialogSource, /onClick=\{\(\) => resetDialog\(false\)\} aria-label="Close" className="flex h-11 w-11[^"]*rounded-\[12px\] bg-\[#333333\] text-white/);
  assert.match(orderDialogSource, /d="M20\.707 4\.70697L19\.293 3\.29297/);

  // Summary card, yellow quantity badge, pill-radius fields and 20px option cards.
  assert.match(orderDialogSource, /rounded-\[20px\] bg-bloop-card p-4/);
  assert.match(orderDialogSource, /bg-\[#F9D05E\][^"]*text-\[#B40000\]/);
  assert.match(orderDialogSource, /const fieldInputClass = "[^"]*rounded-\[14px\] border-2 border-\[#333333\]\/20 bg-bloop-cream[^"]*text-\[16px\][^"]*focus:border-\[#333333\]"/);
  assert.match(orderDialogSource, /const optionCardSelectedClass = "border-\[#DB2828\] bg-\[#FFF6D6\]"/);
  assert.match(orderDialogSource, /\{deliveryOptions\.map\(\(option\) => \([\s\S]*?onClick=\{\(\) => setDeliveryCharge\(option\.charge\)\}[\s\S]*?৳\{option\.charge\}/);

  // Totals and the red pill submit keep their copy and states.
  assert.match(orderDialogSource, /Please select a delivery charge - ডেলিভারি চার্জ সিলেক্ট করুন/);
  assert.match(orderDialogSource, /disabled=\{orderSubmitting\}\s*className="h-14 w-full rounded-full bg-\[#DB2828\] font-bloop text-\[17px\] font-bold/);
  assert.match(orderDialogSource, /\{orderSubmitting \? "Placing Order\.\.\. - অর্ডার হচ্ছে\.\.\." : "Place Order - অর্ডার করুন"\}/);
});
