import assert from "node:assert/strict";
import { test } from "node:test";

import { getProductDetailSections } from "./product-details.ts";

test("curates detailed source content for regular products", () => {
  const cases = [
    {
      slug: "beetroot-powder",
      labels: [
        "বিবরণ",
        "পুষ্টি উপাদান",
        "সম্ভাব্য উপকারিতা",
        "কারা খাদ্যতালিকায় রাখতে পারেন",
        "খাওয়ার সময় ও নিয়ম",
        "গুরুত্বপূর্ণ সতর্কতা",
        "সংরক্ষণের নিয়ম",
      ],
      expected: ["ডায়েটারি নাইট্রেট", "বীটালেইন", "নিম্ন রক্তচাপ"],
      minimumCharacters: 2400,
    },
    {
      slug: "kalojira-mixed",
      labels: [
        "বিবরণ",
        "উপাদানসমূহ",
        "পুষ্টির বৈচিত্র্য",
        "কেন খাদ্যতালিকায় রাখবেন",
        "খাওয়ার সময় ও নিয়ম",
        "পুষ্টিবিদের দৃষ্টিভঙ্গি",
        "সংরক্ষণ ও সতর্কতা",
      ],
      expected: ["কালোজিরা", "রসুন", "ইরানি জাফরান"],
      minimumCharacters: 2450,
    },
    {
      slug: "honey-nut",
      labels: ["বিবরণ", "উপাদানসমূহ", "সম্ভাব্য উপকারিতা", "খাওয়ার সময় ও নিয়ম", "কেন ম্যাংগো লাভারের?", "সংরক্ষণের নিয়ম"],
      expected: ["কাজু বাদাম", "কাঠবাদাম", "মধু"],
      minimumCharacters: 2150,
    },
    {
      slug: "chia-seed",
      labels: ["বিবরণ", "উপাদানসমূহ", "সম্ভাব্য উপকারিতা", "খাওয়ার সময় ও নিয়ম", "কেন ম্যাংগো লাভারের?", "দৈনন্দিন খাদ্যতালিকায় ব্যবহার", "সংরক্ষণের নিয়ম"],
      expected: ["ফাইবার", "উদ্ভিজ্জ প্রোটিন", "ওমেগা-৩"],
      minimumCharacters: 2250,
    },
    {
      slug: "pure-ghee",
      labels: ["বিবরণ", "উপাদানসমূহ", "সম্ভাব্য উপকারিতা", "খাওয়ার সময় ও নিয়ম", "কেন ম্যাংগো লাভারের?", "সংরক্ষণের নিয়ম"],
      expected: ["দুধ", "মসৃণ টেক্সচার", "রান্না"],
      minimumCharacters: 1900,
    },
    {
      slug: "sugarcane-juice-powder",
      labels: ["বিবরণ", "উপাদানসমূহ", "সম্ভাব্য উপকারিতা", "খাওয়ার সময় ও নিয়ম", "কেন ম্যাংগো লাভারের?", "সংরক্ষণের নিয়ম"],
      expected: ["আখের রস", "কার্বোহাইড্রেট", "পানিতে"],
      minimumCharacters: 1400,
    },
    {
      slug: "granulated-sugarcane-jaggery",
      labels: ["বিবরণ", "উপাদানসমূহ", "খাওয়ার সম্ভাব্য উপকারিতা", "খাওয়ার সময় ও নিয়ম", "কেন ম্যাংগো লাভারের?", "সংরক্ষণের নিয়ম"],
      expected: ["আখের রস", "কার্বোহাইড্রেট", "আর্দ্রতা"],
      minimumCharacters: 1800,
    },
    {
      slug: "amsotto-pickle",
      labels: ["বিবরণ", "উপাদানসমূহ", "খাওয়ার উপকারিতা", "খাওয়ার সময় ও নিয়ম", "কেন ম্যাংগো লাভারের?", "সংরক্ষণের নিয়ম"],
      expected: ["পাকা আম", "আখের গুড়", "মিষ্টি-টক"],
      minimumCharacters: 1700,
    },
    {
      slug: "lachcha-semai",
      labels: ["বিবরণ", "উপাদানসমূহ", "খাওয়ার উপকারিতা", "খাওয়ার সময় ও নিয়ম", "কেন ম্যাংগো লাভারের?", "সংরক্ষণের নিয়ম"],
      expected: ["ময়দা", "ঘি", "মিষ্টান্ন"],
      minimumCharacters: 1700,
    },
    {
      slug: "litchi-flower-honey",
      labels: ["বিবরণ", "উপাদানসমূহ", "সম্ভাব্য উপকারিতা", "খাওয়ার সময় ও নিয়ম", "কেন ম্যাংগো লাভারের?", "সংরক্ষণের নিয়ম"],
      expected: ["লিচু ফুলের মধু", "প্রাকৃতিক কার্বোহাইড্রেট", "দানা"],
      minimumCharacters: 1600,
    },
    {
      slug: "mustard-oil",
      labels: ["বিবরণ", "উপাদানসমূহ", "খাওয়ার সম্ভাব্য উপকারিতা", "ব্যবহারের নিয়ম", "কেন ম্যাংগো লাভারের?", "সংরক্ষণের নিয়ম"],
      expected: ["সরিষার বীজ", "অসম্পৃক্ত ফ্যাটি অ্যাসিড", "কাঠের ঘানি"],
      minimumCharacters: 1800,
    },
    {
      slug: "seed-nut-mix",
      labels: ["বিবরণ", "উপাদানসমূহ", "খাওয়ার সম্ভাব্য উপকারিতা", "খাওয়ার সময় ও নিয়ম", "কেন ম্যাংগো লাভারের?", "সংরক্ষণের নিয়ম"],
      expected: ["কুমড়ার বীজ", "প্রোটিন", "কালো কিসমিস"],
      minimumCharacters: 1800,
    },
    {
      slug: "seed-mixed",
      labels: ["বিবরণ", "উপাদানসমূহ", "খাওয়ার সম্ভাব্য উপকারিতা", "খাওয়ার সময় ও নিয়ম", "কেন আমাদের সিড মিক্স?", "সংরক্ষণের নিয়ম"],
      expected: ["তুলসী বীজ", "ইসবগুলের ভূষি", "চিয়া সিড"],
      minimumCharacters: 1700,
    },
    {
      slug: "black-seed-flower-honey",
      labels: ["বিবরণ", "উপাদানসমূহ", "সম্ভাব্য উপকারিতা", "কেন ম্যাংগো লাভারের?", "সংরক্ষণের নিয়ম"],
      expected: ["কালোজিরা ফুলের মধু", "প্রাকৃতিক অ্যান্টিঅক্সিডেন্ট", "দানা তৈরি"],
      minimumCharacters: 1250,
    },
    {
      slug: "sundarbans-natural-honey",
      labels: ["বিবরণ", "উপাদানসমূহ", "সম্ভাব্য উপকারিতা", "কেন ম্যাংগো লাভারের?", "সংরক্ষণের নিয়ম"],
      expected: ["সুন্দরবনের", "প্রাকৃতিক অ্যান্টিঅক্সিডেন্ট", "দানা তৈরি"],
      minimumCharacters: 1250,
    },
    {
      slug: "katimon-mango",
      labels: ["বিবরণ", "বৈশিষ্ট্য", "সম্ভাব্য উপকারিতা", "খাওয়ার সময় ও নিয়ম", "কেন ম্যাংগো লাভারের?", "সংরক্ষণের নিয়ম"],
      expected: ["কাটিমন", "অফসিজন", "কৃত্রিমভাবে পাকানো নয়"],
      minimumCharacters: 1700,
    },
  ];

  for (const { slug, labels, expected, minimumCharacters } of cases) {
    const sections = getProductDetailSections({ slug, name: slug });
    const copy = JSON.stringify(sections);
    assert.deepEqual(sections.map((section) => section.label), labels, `${slug} tab contract changed`);
    assert.ok(copy.length >= minimumCharacters, `${slug} copy should be more detailed`);
    for (const phrase of expected) assert.match(copy, new RegExp(phrase));
    for (const section of sections) {
      assert.ok(section.label);
      assert.ok((section.body?.length ?? 0) + (section.details?.length ?? 0) > 0);
    }
  }
});

test("keeps the existing fallback for an uncurated product", () => {
  const sections = getProductDetailSections({
    slug: "unlisted-product",
    name: "Unlisted",
    description: "Catalog description",
    variants: [{ attributes: { size: "500g" } }],
  });

  assert.deepEqual(sections[0], { label: "বিবরণ", body: ["Catalog description"] });
  assert.deepEqual(sections[1], { label: "Options", details: ["500g"] });
});
