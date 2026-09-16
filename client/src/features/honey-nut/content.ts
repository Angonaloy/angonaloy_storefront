export const HONEY_NUT_CAMPAIGN_PHONE_NUMBER = "01819502705";
export const HONEY_NUT_CAMPAIGN_PHONE_HREF = "tel:+8801819502705";
export const HONEY_NUT_CAMPAIGN_WHATSAPP_HREF = `https://wa.me/8801819502705?text=${encodeURIComponent("হানি নাট অর্ডার করতে চাই।")}`;

export const heroEyebrow = "বাদাম, বীজ ও মধুর প্রাকৃতিক সমন্বয়";
export const heroHeadline = "প্রতিদিনের পুষ্টিতে বাদাম, বীজ ও মধুর প্রাকৃতিক সমন্বয়";
export const heroSubcopy = "বাছাইকৃত বাদাম, পুষ্টিকর বীজ, কালো কিসমিস এবং লিচুফুলের মধুর সমন্বয়ে তৈরি Honey Nut—প্রতিদিনের খাবারে বৈচিত্র্যময় পুষ্টিকর উপাদান যোগ করার একটি সহজ ও সুস্বাদু উপায়।";
export const heroTrustPoints = ["৯টি নির্বাচিত উপাদানের সমন্বয়", "বাদাম, বীজ ও মধুর Natural Combination", "যত্নসহকারে প্রস্তুত ও প্যাকেজ করা"] as const;

export type HoneyNutIngredient = { name: string; image: string; note: string; category: string };
export const ingredients: HoneyNutIngredient[] = [
  { name: "লিচুফুলের মধু", image: "honey-nut-ingredient-honey-v2.webp", category: "প্রাকৃতিক মিষ্টতা", note: "প্রাকৃতিক মিষ্টতা এবং পুরো মিশ্রণের স্বাদ ও texture তৈরি করে।" },
  { name: "কাঠবাদাম", image: "honey-nut-ingredient-almond-v1.webp", category: "বাদাম", note: "Vitamin E, healthy fat এবং উদ্ভিজ্জ প্রোটিনের পরিচিত উৎস।" },
  { name: "কাজুবাদাম", image: "honey-nut-ingredient-cashew-v1.webp", category: "বাদাম", note: "স্বাদ ও texture-এর পাশাপাশি Copper, Magnesium এবং mineral যোগ করে।" },
  { name: "আখরোট", image: "honey-nut-ingredient-walnut-v1.webp", category: "বাদাম", note: "Omega-3 fatty acid-এর উদ্ভিজ্জ উৎস হিসেবে পরিচিত।" },
  { name: "পেস্তা বাদাম", image: "honey-nut-ingredient-pistachio-v2.webp", category: "বাদাম", note: "Protein, healthy fat এবং antioxidant compound-এর প্রাকৃতিক উৎস।" },
  { name: "থাই বাদাম", image: "honey-nut-ingredient-thai-almond-v1.webp", category: "বাদাম", note: "মিশ্রণে বাদামের স্বাদ, texture ও বৈচিত্র্য যোগ করে।" },
  { name: "সূর্যমুখী বীজ", image: "honey-nut-ingredient-sunflower-seed-v1.webp", category: "বীজ", note: "Vitamin E, healthy fat এবং বিভিন্ন mineral-এর উৎস।" },
  { name: "কালো কিসমিস", image: "honey-nut-ingredient-black-raisin-v1.webp", category: "শুকনো ফল", note: "প্রাকৃতিক মিষ্টতা, carbohydrate এবং micronutrient যোগ করে।" },
  { name: "সাদা তিল", image: "honey-nut-ingredient-white-sesame-v1.webp", category: "বীজ", note: "Calcium, healthy fat এবং plant nutrient-এর উৎস।" },
];

export const nutritionHeading = "শুধু স্বাদ নয়—প্রতিটি উপাদানের আছে নিজস্ব পুষ্টিগুণ";
export const nutritionGroups = [
  { mark: "P", title: "উদ্ভিজ্জ প্রোটিন", text: "বাদাম ও বিভিন্ন বীজ উদ্ভিজ্জ প্রোটিনের প্রাকৃতিক উৎস।" },
  { mark: "F", title: "স্বাস্থ্যকর ফ্যাট", text: "বিভিন্ন বাদামে প্রাকৃতিকভাবে Unsaturated Fat বা স্বাস্থ্যকর ফ্যাট থাকে।" },
  { mark: "Fi", title: "খাদ্য আঁশ", text: "বাদাম, বীজ ও কিসমিস দৈনন্দিন খাদ্যে খাদ্য আঁশের বৈচিত্র্য যোগ করে।" },
  { mark: "E", title: "ভিটামিন ও মিনারেল", text: "Vitamin E, Magnesium, Zinc, Iron সহ বিভিন্ন micronutrient উপাদানভেদে পাওয়া যায়।" },
] as const;

export const nutritionStoryHeading = "কোন উপাদান কেন রাখা হয়েছে?";
export const nutritionStory = ingredients.map(({ name, note }) => ({ title: name, text: note }));

export const nutritionistHeading = "পুষ্টির দৃষ্টিকোণ থেকে উপাদান নির্বাচন";
export const nutritionistName = "মুরাদ পারভেজ";
export const nutritionistCredentials = "BSc — খাদ্য প্রযুক্তি ও পুষ্টিবিজ্ঞান | MSc — খাদ্য নিরাপত্তা এবং জনস্বাস্থ্য পুষ্টি\nনোয়াখালী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়";
export const nutritionistStatement = "খাদ্য শুধু স্বাদের বিষয় নয়—খাবারের উপাদান, বৈচিত্র্য, গুণগত মান এবং খাদ্য নিরাপত্তাও সমান গুরুত্বপূর্ণ। Honey Nut-এর জন্য বাদাম, বীজ, কিসমিস ও মধুর সমন্বয় তৈরি করার ক্ষেত্রে এমন উপাদান নির্বাচন করা হয়েছে, যেগুলো স্বাদের পাশাপাশি দৈনন্দিন খাদ্যে বিভিন্ন ধরনের পুষ্টি উপাদান যোগ করতে পারে। আমাদের উদ্দেশ্য অতিরঞ্জিত স্বাস্থ্য দাবি করা নয়। বরং পরিচিত ও নির্বাচিত খাদ্য উপাদান দিয়ে একটি সুন্দর, উপভোগ্য এবং পুষ্টিসমৃদ্ধ food combination তৈরি করা।";

export const servingHeading = "আপনার দৈনন্দিন খাবারে সহজেই যোগ করতে পারেন";
export const servingNote = "নিজের খাদ্যাভ্যাস ও পছন্দ অনুযায়ী পরিমিতভাবে পরিবেশন করুন।";
export const servingPoints = [
  { title: "🥄 সরাসরি", text: "অল্প পরিমাণ নিয়ে সরাসরি খেতে পারেন।" },
  { title: "🍞 রুটি বা টোস্টের সঙ্গে", text: "সকালের নাশতায় সহজে যোগ করা যায়।" },
  { title: "🥣 Breakfast Bowl", text: "Oats বা অন্যান্য breakfast-এর সঙ্গে ব্যবহার করা যায়।" },
  { title: "🥛 পছন্দের খাবারের সঙ্গে", text: "নিজের খাদ্যাভ্যাস ও পছন্দ অনুযায়ী পরিবেশন করতে পারেন।" },
] as const;

export const qualityPoints = ["নির্বাচিত উপাদান", "পরিষ্কার ও যত্নশীল প্রস্তুত প্রক্রিয়া", "Food-grade container", "Secure Packaging", "Delivery-এর জন্য Protective Packing"] as const;
export const qualityHeading = "উপাদান থেকে প্যাকেজিং—প্রতিটি ধাপে যত্ন";

export const faqHeading = "সাধারণ কিছু প্রশ্ন";
export const faqQuestions = ["Honey Nut-এ কী কী উপাদান আছে?", "প্যাকের ওজন কত?", "কীভাবে সংরক্ষণ করতে হবে?", "কারা খেতে পারবেন?", "বাদামে অ্যালার্জি থাকলে?"] as const;
export const faqAnswers = [
  "লিচুফুলের মধু, কাঠবাদাম, কাজুবাদাম, আখরোট, পেস্তা বাদাম, থাই বাদাম, সূর্যমুখী বীজ, কালো কিসমিস ও সাদা তিল।",
  "প্রতি জারে মোট ৫০০ গ্রাম এবং ১ কেজি Honey Nut পাওয়া যায়।",
  "ঠান্ডা ও শুষ্ক স্থানে রাখুন। সরাসরি সূর্যের আলো থেকে দূরে রাখুন এবং ব্যবহারের পর ঢাকনা ভালোভাবে বন্ধ করুন।",
  "এটি একটি সাধারণ খাদ্যপণ্য। ব্যক্তিগত খাদ্যাভ্যাস, অ্যালার্জি বা বিশেষ স্বাস্থ্যগত প্রয়োজন থাকলে নিজের প্রয়োজন অনুযায়ী উপাদান যাচাই করে গ্রহণ করা উচিত।",
  "Nut allergy বা সংশ্লিষ্ট কোনো উপাদানে অ্যালার্জি থাকলে এই পণ্য গ্রহণ করা উচিত নয়।",
] as const;
export const importantNotes = ["এটি খাদ্যপণ্য; ওষুধ নয় এবং চিকিৎসার বিকল্পও নয়।", "Nut allergy থাকলে গ্রহণ করবেন না।", "সুষম খাবার, পানি, বিশ্রাম ও নিয়মিত কার্যক্রমকে গুরুত্ব দিন।"] as const;

export const finalCtaText = "পুষ্টিকর উপাদানের একটি সুন্দর সমন্বয়—এক জারেই";

export const honeyNutReviews = [
  {
    quote: "প্রথমে ভেবেছিলাম মধু দেওয়া বলে হয়তো বেশি মিষ্টি লাগবে। খেয়ে দেখলাম মিষ্টিটা ব্যালান্সড, বাদামগুলো মচমচে। সকালে ২ চামচ করে খাই।",
    name: "তানভীর আহমেদ",
    role: "যাচাইকৃত ক্রেতা",
    company: "ঢাকা",
  },
  {
    quote: "জারটা হাতে পেয়ে ভালো লেগেছে, প্যাকেজিংটা যত্ন করে করা। আমি ওটসের সাথে মিশিয়ে খাই, মেয়েও টিফিনে নিয়ে যায়। ডেলিভারিও সময়মতো পেয়েছি।",
    name: "শারমিন আক্তার",
    role: "যাচাইকৃত ক্রেতা",
    company: "চট্টগ্রাম",
  },
  {
    quote: "আখরোট আর কাজুবাদামের পরিমাণ ভালোই আছে, কালো কিসমিসটা সুন্দর মিষ্টি ভাব আনে। ৫০০ গ্রামের জারটা প্রায় শেষ, আবার নেব ইনশাআল্লাহ।",
    name: "আরিফুল ইসলাম",
    role: "যাচাইকৃত ক্রেতা",
    company: "রাজশাহী",
  },
] as const;
