# Homemade Pumpkin Bori Product Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add curated Bengali detail tabs for the `homemade-pumpkin-bori` product page.

**Architecture:** Extend the existing slug-keyed `productDetailSections` map. The product page already renders these sections through `getProductDetailSections`, so no component or routing changes are needed.

**Tech Stack:** React, TypeScript, existing product-detail data map, Node test runner.

## Global Constraints

- Keep all copy in Bengali.
- Scope changes to the `homemade-pumpkin-bori` slug.
- Use only confirmed claims: মাষকলাই ডাল, টাটকা চালকুমড়ো, হাতে তৈরি, ঘরোয়া পরিবেশ, রোদে শুকানো, পরিষ্কার-পরিচ্ছন্ন প্রস্তুতি.
- Do not claim chemical-free, preservative-free, organic, or a fixed shelf life.
- Preserve the existing product-page tab layout and responsive behavior.

### Task 1: Add Pumpkin Bori detail sections

**Files:**
- Modify: `client/src/lib/product-details.ts`
- Test: `client/src/lib/product-details.test.ts`

**Interfaces:**
- Consumes: `StorefrontProduct.slug === "homemade-pumpkin-bori"`.
- Produces: seven Bengali `ProductDetailSection` entries consumed by `getProductDetailSections`.

- [ ] **Step 1: Write the failing assertions**

Add assertions that the slug returns sections labelled `বিবরণ`, `বৈশিষ্ট্য`, `উপকরণ`, `রান্নার পরামর্শ`, `সংরক্ষণের নিয়ম`, `প্যাক সাইজ`, and `কেন ম্যাংগো লাভারের?`, and that the content contains `মাষকলাই`, `চালকুমড়ো`, `হাতে তৈরি`, `রোদে শুকানো`, `৫০০ গ্রাম`, and `১ কেজি`.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --import tsx --test client/src/lib/product-details.test.ts`

Expected: FAIL because no curated entry exists for `homemade-pumpkin-bori`.

- [ ] **Step 3: Add the curated Bengali entry**

Insert the slug entry in `productDetailSections` with:

```ts
"homemade-pumpkin-bori": [
  { label: "বিবরণ", body: ["বাছাই করা মাষকলাইয়ের ডাল ও টাটকা চালকুমড়ো দিয়ে ঘরোয়া পরিবেশে তৈরি ঐতিহ্যবাহী কুমড়ো বড়ি। অভিজ্ঞ কারিগরদের হাতে বড়ি তৈরি করে পরিষ্কার-পরিচ্ছন্নভাবে রোদে শুকানো হয়।"] },
  { label: "বৈশিষ্ট্য", details: ["হাতে তৈরি", "ঘরোয়া পদ্ধতিতে প্রস্তুত", "পরিষ্কার-পরিচ্ছন্নভাবে রোদে শুকানো", "ঐতিহ্যবাহী বাঙালি খাবারের স্বাদ"] },
  { label: "উপকরণ", details: ["বাছাই করা মাষকলাইয়ের ডাল", "টাটকা চালকুমড়ো"] },
  { label: "রান্নার পরামর্শ", body: ["বড়ি অল্প তেলে হালকা ভেজে মাছ, সবজি, শাক, ডাল বা চালকুমড়োর তরকারিতে ব্যবহার করুন। রান্না শেষ হওয়ার প্রায় ১৫–২০ মিনিট আগে ভাজা বড়ি দিলে স্বাদ ও গঠন ভালো থাকে।"] },
  { label: "সংরক্ষণের নিয়ম", details: ["বায়ুরোধী পাত্রে রাখুন", "ঠান্ডা ও শুকনো স্থানে সংরক্ষণ করুন", "আর্দ্রতা ও পানির সংস্পর্শ থেকে দূরে রাখুন", "প্যাকেটের Best Before নির্দেশনা অনুসরণ করুন"] },
  { label: "প্যাক সাইজ", details: ["৫০০ গ্রাম", "১ কেজি"] },
  { label: "কেন ম্যাংগো লাভারের?", body: ["উপাদান নির্বাচন, পরিচ্ছন্ন প্রস্তুতি ও যত্নশীল প্যাকেজিংকে গুরুত্ব দিয়ে ম্যাংগো লাভার আপনাদের ঘরে পৌঁছে দেয় পরিচিত ঘরোয়া স্বাদের কুমড়ো বড়ি।"] },
],
```

- [ ] **Step 4: Run focused verification**

Run: `node --import tsx --test client/src/lib/product-details.test.ts` and `npm run check`.

Expected: all focused tests pass and TypeScript exits successfully.

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/product-details.ts client/src/lib/product-details.test.ts
git commit -m "feat: add pumpkin bori product details"
```
