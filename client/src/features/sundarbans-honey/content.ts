export const HONEY_CAMPAIGN_PHONE_NUMBER = "01819502705";
export const HONEY_CAMPAIGN_PHONE_HREF = "tel:+8801819502705";
export const HONEY_CAMPAIGN_WHATSAPP_HREF =
  `https://wa.me/8801819502705?text=${encodeURIComponent("সুন্দরবনের প্রাকৃতিক মধু অর্ডার করতে চাই।")}`;

export const heroHeadline = "সুন্দরবনের চাকের মধু—প্রকৃতির আসল স্বাদ";
export const heroSubcopy =
  "মৌচাক থেকে বোতল পর্যন্ত—সুন্দরবনের বুনো ফুলের নেকটার থেকে সংগ্রহ করা মধু, যত্নে আপনার ঘরে।";

export const trustRibbonItems = [
  { title: "সুন্দরবনের উৎস", text: "বুনো ফুলের নেকটার থেকে সংগৃহীত মধু" },
  { title: "পরিষ্কারভাবে বোতলজাত", text: "মৌচাক থেকে বোতল—প্রতিটি ধাপে যত্ন" },
  { title: "হাতে পেয়ে মূল্য দিন", text: "সারা দেশে সহজ ক্যাশ অন ডেলিভারি" },
] as const;

export const collectionReelHeading = "বনের গল্প, বাস্তব ভিডিওতে";
export const collectionReelSubcopy =
  "বাস্তব সংগ্রহের ফুটেজে দেখুন—কোথা থেকে আসে মধু, আর কীভাবে পৌঁছে যায় আপনার ঘরে।";
export const whySpecialLead = "বনের স্বাদ, প্রাকৃতিক বৈচিত্র্য, এক বোতলে।";
export const founderHeading = "পণ্যের পেছনের মানুষটির সঙ্গে পরিচিত হোন";
export const founderSubcopy =
  "কেন এই উৎস বেছে নিয়েছি, কীভাবে মান বজায় রাখি, এবং গ্রাহকের কাছে আমাদের দায়িত্ব কী—জানুন আমাদের গল্পে।";
export const faqHeading = "অর্ডারের আগে যা জানা দরকার";
export const faqQuestions = [
  "মধু কতদিন ভালো থাকবে?",
  "এক বছরের বেশি বয়সী শিশুরা কি খেতে পারবে?",
  "মধু জমে গেলে কি সমস্যা?",
  "কীভাবে সংরক্ষণ করবো?",
] as const;
export const faqAnswers = [
  "বোতলের গায়ে থাকা তারিখ ও নির্দেশনা অনুসরণ করুন। ঢাকনা ভালোভাবে বন্ধ রাখলে মধুর স্বাদ ও গুণমান বজায় থাকে।",
  "এক বছরের কম বয়সী শিশুকে মধু দেওয়া যাবে না। এর বেশি বয়সে বয়স ও শারীরিক অবস্থা অনুযায়ী পরিমিত পরিমাণে দিন।",
  "মধু দানাদার বা জমাট বাঁধা একটি স্বাভাবিক প্রাকৃতিক প্রক্রিয়া হতে পারে। বোতলটি হালকা গরম পানিতে রাখতে পারেন; ফুটন্ত পানি ব্যবহার করবেন না।",
  "সরাসরি রোদ থেকে দূরে, স্বাভাবিক তাপমাত্রায় রাখুন এবং প্রতিবার ব্যবহারের পর ঢাকনা ভালোভাবে বন্ধ করুন।",
] as const;
export const comparisonHeading = "পার্থক্যটা নিজেই দেখুন";

export type HoneyNarrativePoint = {
  title: string;
  text: string;
};

export const whySpecialHeading = "কেন সুন্দরবনের চাকের মধু বিশেষ?";
export const whySpecialPoints: HoneyNarrativePoint[] = [
  {
    title: "সুন্দরবনের বন ও ফুল",
    text: "সুন্দরবনের নানা বুনো ফুলের নেকটার থেকে মৌমাছি এই মধু সংগ্রহ করে।",
  },
  {
    title: "স্বতন্ত্র স্বাদ ও ঘ্রাণ",
    text: "বুনো ফুলের বৈচিত্র্যের কারণে এর স্বাদ, ঘ্রাণ ও রং অন্য মধুর চেয়ে আলাদা।",
  },
  {
    title: "প্রাকৃতিক শর্করায় শক্তি",
    text: "মধুতে থাকা প্রাকৃতিক শর্করা সুষম খাদ্যের অংশ হিসেবে দৈনন্দিন কাজের শক্তি জোগায়।",
  },
  {
    title: "প্রাকৃতিক অ্যান্টিঅক্সিডেন্ট যৌগ",
    text: "মধুতে স্বাভাবিকভাবেই নানা প্রাকৃতিক অ্যান্টিঅক্সিডেন্ট যৌগ পাওয়া যায়।",
  },
  {
    title: "প্রতিদিনের ব্যবহারে সহজ",
    text: "চামচে, রুটির সঙ্গে কিংবা হালকা গরম পানিতে—অল্প পরিমাণে সহজেই খাওয়া যায়।",
  },
];

export const whoCanConsumeHeading = "পরিবারের কারা খেতে পারেন?";
export const whoCanConsumePoints: HoneyNarrativePoint[] = [
  {
    title: "এক বছরের বেশি বয়সী শিশু",
    text: "বয়স ও শারীরিক অবস্থা অনুযায়ী পরিমিত পরিমাণে নাশতার সঙ্গে।",
  },
  {
    title: "শিক্ষার্থী ও কর্মজীবী মানুষ",
    text: "ব্যস্ত দিনে সুষম নাশতার অংশ হিসেবে অল্প পরিমাণে।",
  },
  {
    title: "শারীরিকভাবে সক্রিয় মানুষ",
    text: "কাজ বা খেলাধুলার ফাঁকে প্রাকৃতিক শক্তির সহজ উৎস হিসেবে।",
  },
  {
    title: "পরিবারের বয়স্ক সদস্য",
    text: "হালকা গরম পানি বা সকালের নাশতার সঙ্গে পরিমিত পরিমাণে।",
  },
];

export const waysToEnjoyHeading = "যেভাবে খেতে পারেন";
export const waysToEnjoyNote = "একবারে অল্প পরিমাণে খান। ফুটন্ত গরম পানিতে মধু মেশাবেন না।";
export const waysToEnjoyPoints: HoneyNarrativePoint[] = [
  { title: "চামচে", text: "সকালে এক চামচ সরাসরি খেতে পারেন।" },
  { title: "রুটির সঙ্গে", text: "গরম রুটিতে হালকা করে মাখিয়ে নিন।" },
  { title: "ওটস, দই বা ফলের সঙ্গে", text: "সকালের নাশতায় মিশিয়ে স্বাদ বাড়িয়ে নিন।" },
  { title: "হালকা গরম পানিতে", text: "কুসুম গরম পানিতে গুলিয়ে পান করুন।" },
];

export const journeyHeading = "সুন্দরবন থেকে আপনার ঘরে";
export const journeyStages: HoneyNarrativePoint[] = [
  {
    title: "বন ও ফুল",
    text: "সুন্দরবনের গভীর বনে ঋতুভেদে নানা বুনো ফুল ফোটে; মৌমাছি সেখান থেকে নেকটার সংগ্রহ করে।",
  },
  {
    title: "প্রাকৃতিক মৌচাক",
    text: "গাছের ডালে বুনো মৌমাছির বড় চাকে জমা মধু—প্রাকৃতিক মৌচাক থেকে সংগ্রহ করা মধু।",
  },
  {
    title: "সংগ্রহ ও বোতলজাত",
    text: "অভিজ্ঞ সংগ্রাহকরা সাবধানে চাক থেকে মধু সংগ্রহ করেন; পরে পরিচ্ছন্নভাবে ছেঁকে বোতলজাত করা হয়।",
  },
];

export const nutritionistHeading = "পুষ্টিবিদের বক্তব্য";
export const nutritionistName = "মুরাদ পারভেজ";
export const nutritionistStatement =
  "মধু কোনো রোগের ওষুধ নয়। তবে সুষম খাদ্যাভ্যাসের অংশ হিসেবে পরিমিত মধু প্রাকৃতিক শক্তির একটি সহজ উৎস হতে পারে। এতে বিভিন্ন প্রাকৃতিক অ্যান্টিঅক্সিডেন্ট যৌগও পাওয়া যায়। শিশু, কর্মজীবী মানুষ ও বয়স্ক ব্যক্তি সবাই বয়স ও শারীরিক অবস্থা অনুযায়ী পরিমিত পরিমাণে মধু গ্রহণ করতে পারেন। পণ্য বিক্রির পাশাপাশি গ্রাহককে সঠিক তথ্য জানানোও আমাদের দায়িত্ব।";

export const whyAngonaloyHeading = "Angonaloy vs অন্যান্য Brands";
export const whyMangoLoverPoints: HoneyNarrativePoint[] = [
  {
    title: "উৎস সম্পর্কে স্বচ্ছ তথ্য",
    text: "কোন বনের কোন প্রক্রিয়ায় মধু এলো—লুকোছাপা ছাড়াই জানিয়ে দিই।",
  },
  {
    title: "সংগ্রহ প্রক্রিয়ার বর্ণনা",
    text: "সংগ্রহ থেকে বোতলজাত পর্যন্ত প্রতিটি ধাপ লিখিতভাবে জানিয়ে দিই।",
  },
  {
    title: "পরিচ্ছন্ন সংগ্রহ ও বোতলজাত",
    text: "ছাঁকা থেকে বোতলজাত—প্রতিটি ধাপে পরিষ্কার-পরিচ্ছন্নতা মানা হয়।",
  },
  {
    title: "দায়িত্বশীল নির্দেশনা",
    text: "কার জন্য কতটুকু উপযুক্ত, সতর্কতাসহ স্পষ্ট করে জানিয়ে দিই।",
  },
  {
    title: "সারা দেশে হোম ডেলিভারি",
    text: "বাংলাদেশের যেকোনো ঠিকানায় যত্নে প্যাক করে পৌঁছে দিই।",
  },
  {
    title: "ক্যাশ অন ডেলিভারি",
    text: "পণ্য হাতে পেয়ে মূল্য পরিশোধ—আগে টাকা দেওয়ার ঝামেলা নেই।",
  },
];

export const importantNotesHeading = "গুরুত্বপূর্ণ তথ্য";

// Reviews ship-gate (spec: Error and edge states). The review section is
// intentionally omitted until BOTH hold: genuine supplied reviews with display
// permission AND explicit stakeholder approval to ship with or without them.
// Approval status: PENDING — do not invent it. Task 9 must not claim the page
// shippable on reviews without flipping this gate with recorded approval.
export const honeyReviewsShipGate = {
  shipped: false,
  requiresGenuineReviews: true,
  requiresStakeholderApproval: true,
  stakeholderApproval: "pending",
} as const;
export type HoneyImportantNote = {
  tone: "warning" | "info";
  text: string;
};
export const importantNotes: HoneyImportantNote[] = [
  { tone: "warning", text: "এক বছরের কম বয়সী শিশুকে মধু দেওয়া যাবে না।" },
  { tone: "warning", text: "ডায়াবেটিস বা রক্তে শর্করার সমস্যা থাকলে চিকিৎসক বা পুষ্টিবিদের পরামর্শ নিন।" },
  { tone: "info", text: "সরাসরি রোদ থেকে দূরে, স্বাভাবিক তাপমাত্রায় রাখুন।" },
  { tone: "info", text: "ফুল ও ঋতুভেদে প্রাকৃতিক মধুর রং, স্বাদ ও ঘনত্ব কিছুটা বদলাতে পারে।" },
  { tone: "info", text: "মধু দানাদার বা জমাট বাঁধা একটি স্বাভাবিক প্রাকৃতিক প্রক্রিয়া হতে পারে।" },
];
