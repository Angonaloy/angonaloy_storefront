export type BilingualText = {
  en: string;
  bn: string;
};

export type SitePageSection = {
  heading: BilingualText;
  body: BilingualText;
};

export type SitePage = {
  slug: string;
  title: BilingualText;
  intro: BilingualText;
  sections: readonly SitePageSection[];
};

export const POLICY_FACTS = {
  deliveryCharge: 100,
  freeDeliveryThreshold: 2600,
  dhakaDeliveryDays: "1–2 days",
  outsideDhakaDeliveryDays: "2–3 days",
  paymentMethod: "Cash on Delivery",
} as const;

export const CONTACT_DETAILS = {
  address: "Nowhata, Paba, Rajshahi, Bangladesh – 6213",
  phone: "01301-636461",
  whatsapp: "+8801301636461",
  whatsappHref: "https://wa.me/8801301636461",
  email: "mangolover.com.bd@gmail.com",
} as const;

const text = (en: string, bn: string): BilingualText => ({ en, bn });

const section = (heading: BilingualText, body: BilingualText): SitePageSection => ({ heading, body });

const page = (slug: string, title: BilingualText, intro: BilingualText, sections: readonly SitePageSection[]): SitePage => ({
  slug,
  title,
  intro,
  sections,
});

export const SITE_PAGES = {
  "about-us": page(
    "about-us",
    text("About Mango Lover", "ম্যাংগো লাভার সম্পর্কে"),
    text(
      "Mango Lover BD brings carefully selected food products from Bangladesh to your home with honesty, care, and dependable service.",
      "ম্যাংগো লাভার বিডি সততা, যত্ন ও নির্ভরযোগ্য সেবার সঙ্গে বাংলাদেশের বাছাই করা খাদ্যপণ্য আপনার ঘরে পৌঁছে দেয়।",
    ),
    [
      section(
        text("Our story", "আমাদের গল্প"),
        text(
          "Mango Lover started with a simple idea: good food should be easy to discover and safe to order. We work to bring authentic everyday products, seasonal favorites, and thoughtful food choices together in one place.",
          "ম্যাংগো লাভারের শুরু একটি সহজ ভাবনা থেকে: ভালো খাবার খুঁজে পাওয়া ও অর্ডার করা সহজ হওয়া উচিত। আমরা খাঁটি দৈনন্দিন পণ্য, মৌসুমি পছন্দ এবং যত্নসহকারে বাছাই করা খাবার এক জায়গায় নিয়ে আসার চেষ্টা করি।",
        ),
      ),
      section(
        text("What we care about", "যে বিষয়গুলো আমাদের কাছে গুরুত্বপূর্ণ"),
        text(
          "We care about clear product information, careful packing, responsive communication, and a customer experience that feels personal from order to delivery.",
          "সঠিক পণ্যের তথ্য, যত্নসহকারে প্যাকেজিং, দ্রুত যোগাযোগ এবং অর্ডার থেকে ডেলিভারি পর্যন্ত ব্যক্তিগত যত্নের অভিজ্ঞতা—এই বিষয়গুলো আমাদের কাছে গুরুত্বপূর্ণ।",
        ),
      ),
      section(
        text("Our location", "আমাদের ঠিকানা"),
        text(
          "Mango Lover BD is based in Nowhata, Paba, Rajshahi, Bangladesh. We serve customers across Bangladesh according to our current delivery coverage.",
          "ম্যাংগো লাভার বিডির ঠিকানা নওহাটা, পবা, রাজশাহী, বাংলাদেশ। আমাদের বর্তমান ডেলিভারি কাভারেজ অনুযায়ী আমরা বাংলাদেশের বিভিন্ন স্থানে সেবা দিয়ে থাকি।",
        ),
      ),
    ],
  ),
  "contact-us": page(
    "contact-us",
    text("Contact Us", "যোগাযোগ করুন"),
    text(
      "We are here to help with product questions, order confirmation, delivery updates, and customer support.",
      "পণ্য সম্পর্কে প্রশ্ন, অর্ডার কনফার্মেশন, ডেলিভারি আপডেট এবং কাস্টমার সাপোর্টের জন্য আমরা আপনার পাশে আছি।",
    ),
    [
      section(
        text("Phone and WhatsApp", "ফোন ও হোয়াটসঅ্যাপ"),
        text(
          `Call us at ${CONTACT_DETAILS.phone} or message us on WhatsApp at ${CONTACT_DETAILS.whatsapp}. Please keep your order details ready when asking about an existing order.`,
          `আমাদের ${CONTACT_DETAILS.phone} নম্বরে কল করুন অথবা ${CONTACT_DETAILS.whatsapp} নম্বরে হোয়াটসঅ্যাপে মেসেজ দিন। আগের অর্ডার সম্পর্কে জানতে অর্ডারের তথ্য কাছে রাখুন।`,
        ),
      ),
      section(
        text("Email and address", "ইমেইল ও ঠিকানা"),
        text(
          `Email: ${CONTACT_DETAILS.email}\nAddress: ${CONTACT_DETAILS.address}`,
          `ইমেইল: ${CONTACT_DETAILS.email}\nঠিকানা: ${CONTACT_DETAILS.address}`,
        ),
      ),
      section(
        text("What to include in a support request", "সাপোর্টের জন্য যে তথ্যগুলো দেবেন"),
        text(
          "Tell us your name, phone number, order reference if available, and a short description of the issue. For damaged or incorrect products, include the unboxing photo or video as soon as possible.",
          "আপনার নাম, ফোন নম্বর, অর্ডার রেফারেন্স থাকলে তা এবং সমস্যার সংক্ষিপ্ত বিবরণ দিন। ক্ষতিগ্রস্ত বা ভুল পণ্যের ক্ষেত্রে যত দ্রুত সম্ভব আনবক্সিংয়ের ছবি বা ভিডিও পাঠান।",
        ),
      ),
    ],
  ),
  "how-to-order": page(
    "how-to-order",
    text("How to Order", "কীভাবে অর্ডার করবেন"),
    text(
      "Ordering from Mango Lover is simple. Browse the catalog, add your products to the cart, and complete checkout with your delivery details.",
      "ম্যাংগো লাভার থেকে অর্ডার করা সহজ। ক্যাটালগ দেখুন, পছন্দের পণ্য কার্টে যোগ করুন এবং ডেলিভারির তথ্য দিয়ে চেকআউট সম্পন্ন করুন।",
    ),
    [
      section(
        text("1. Choose your products", "১. পণ্য বেছে নিন"),
        text(
          "Open a product or collection page, review the available details and variants, then select Add to Cart.",
          "পণ্য বা কালেকশন পেজ খুলে পণ্যের তথ্য ও ভ্যারিয়েন্ট দেখুন, তারপর কার্টে যোগ করুন।",
        ),
      ),
      section(
        text("2. Review your cart", "২. কার্ট যাচাই করুন"),
        text(
          "Check the products, quantities, and total amount in your cart. Delivery is ৳100, or free when the order value is over ৳2600.",
          "কার্টে পণ্য, পরিমাণ ও মোট মূল্য যাচাই করুন। ডেলিভারি চার্জ ৳১০০, তবে অর্ডারের মূল্য ৳২৬০০-এর বেশি হলে ডেলিভারি ফ্রি।",
        ),
      ),
      section(
        text("3. Enter delivery details", "৩. ডেলিভারির তথ্য দিন"),
        text(
          "Provide your name, phone number, and complete delivery address. A clear address helps our team deliver your order without delay.",
          "আপনার নাম, ফোন নম্বর এবং সম্পূর্ণ ডেলিভারি ঠিকানা দিন। পরিষ্কার ঠিকানা দিলে আমাদের টিম দ্রুত ও সঠিকভাবে অর্ডার পৌঁছে দিতে পারে।",
        ),
      ),
      section(
        text("4. Confirm with Cash on Delivery", "৪. ক্যাশ অন ডেলিভারিতে কনফার্ম করুন"),
        text(
          "Mango Lover currently accepts Cash on Delivery only. Our team may contact you to confirm the order before dispatch.",
          "ম্যাংগো লাভারে বর্তমানে শুধু ক্যাশ অন ডেলিভারি গ্রহণ করা হয়। ডিসপ্যাচের আগে অর্ডার নিশ্চিত করতে আমাদের টিম আপনার সঙ্গে যোগাযোগ করতে পারে।",
        ),
      ),
    ],
  ),
  "shipping-policy": page(
    "shipping-policy",
    text("Shipping & Delivery Policy", "শিপিং ও ডেলিভারি নীতিমালা"),
    text(
      "We prepare and deliver orders with care across our current Bangladesh delivery coverage.",
      "আমাদের বর্তমান বাংলাদেশ ডেলিভারি কাভারেজের মধ্যে আমরা যত্নসহকারে অর্ডার প্রস্তুত ও ডেলিভারি করি।",
    ),
    [
      section(
        text("Delivery charge", "ডেলিভারি চার্জ"),
        text(
          "A standard delivery charge of ৳100 applies to orders below ৳2600. Delivery is free for orders over ৳2600.",
          "৳২৬০০-এর কম মূল্যের অর্ডারের জন্য সাধারণ ডেলিভারি চার্জ ৳১০০। ৳২৬০০-এর বেশি অর্ডারে ডেলিভারি ফ্রি।",
        ),
      ),
      section(
        text("Estimated delivery time", "সম্ভাব্য ডেলিভারি সময়"),
        text(
          "Orders inside Dhaka generally arrive within 1–2 days. Orders outside Dhaka generally arrive within 2–3 days. These are estimates and may vary because of holidays, weather, courier conditions, or an incomplete address.",
          "ঢাকার ভেতরে অর্ডার সাধারণত ১–২ দিনের মধ্যে পৌঁছে যায়। ঢাকার বাইরে অর্ডার সাধারণত ২–৩ দিনের মধ্যে পৌঁছে যায়। ছুটির দিন, আবহাওয়া, কুরিয়ার পরিস্থিতি বা অসম্পূর্ণ ঠিকানার কারণে সময় কিছুটা পরিবর্তিত হতে পারে।",
        ),
      ),
      section(
        text("Delivery address and availability", "ডেলিভারি ঠিকানা ও প্রাপ্যতা"),
        text(
          "Please provide a complete address and an active phone number. Our team or delivery partner may call if the address is difficult to locate. Delivery coverage and charges may be reviewed from time to time.",
          "সম্পূর্ণ ঠিকানা ও সচল ফোন নম্বর দিন। ঠিকানা খুঁজে পেতে সমস্যা হলে আমাদের টিম বা ডেলিভারি পার্টনার ফোন করতে পারে। ডেলিভারি কাভারেজ ও চার্জ সময়ে সময়ে পর্যালোচনা করা হতে পারে।",
        ),
      ),
      section(
        text("Receiving your order", "অর্ডার গ্রহণের সময়"),
        text(
          "Please check the package when it arrives and keep an unboxing photo or video for food-product complaints. If an item is damaged, spoiled, or incorrect, contact us within 24 hours of delivery.",
          "প্যাকেজ হাতে পাওয়ার সময় তা যাচাই করুন এবং খাদ্যপণ্যের অভিযোগের জন্য আনবক্সিংয়ের ছবি বা ভিডিও রাখুন। কোনো পণ্য ক্ষতিগ্রস্ত, নষ্ট বা ভুল হলে ডেলিভারির ২৪ ঘণ্টার মধ্যে আমাদের জানান।",
        ),
      ),
    ],
  ),
  "payment-policy": page(
    "payment-policy",
    text("Payment Policy", "পেমেন্ট নীতিমালা"),
    text(
      "Mango Lover currently offers one payment method: Cash on Delivery.",
      "ম্যাংগো লাভারে বর্তমানে একটি পেমেন্ট পদ্ধতি চালু আছে: ক্যাশ অন ডেলিভারি।",
    ),
    [
      section(
        text("Cash on Delivery", "ক্যাশ অন ডেলিভারি"),
        text(
          "Pay the confirmed order amount in cash when your package is delivered. Please keep the exact or near-exact amount ready to make delivery easier.",
          "প্যাকেজ ডেলিভারির সময় নিশ্চিত করা অর্ডারের মূল্য নগদে পরিশোধ করুন। ডেলিভারি সহজ করতে সঠিক বা কাছাকাছি পরিমাণ টাকা প্রস্তুত রাখুন।",
        ),
      ),
      section(
        text("Order confirmation", "অর্ডার কনফার্মেশন"),
        text(
          "Our team may call or message you to verify the order, phone number, address, products, and payable amount before dispatch.",
          "ডিসপ্যাচের আগে অর্ডার, ফোন নম্বর, ঠিকানা, পণ্য এবং পরিশোধযোগ্য মূল্য যাচাই করতে আমাদের টিম ফোন বা মেসেজ করতে পারে।",
        ),
      ),
      section(
        text("No online payment at this time", "এই মুহূর্তে অনলাইন পেমেন্ট নেই"),
        text(
          "Online card, mobile-wallet, or advance payment is not currently required or available through this storefront. Never send money to an unofficial account claiming to represent Mango Lover.",
          "এই স্টোরফ্রন্টে বর্তমানে অনলাইন কার্ড, মোবাইল ওয়ালেট বা অগ্রিম পেমেন্টের প্রয়োজন বা ব্যবস্থা নেই। ম্যাংগো লাভারের পরিচয়ে কোনো অননুমোদিত অ্যাকাউন্টে টাকা পাঠাবেন না।",
        ),
      ),
    ],
  ),
  "terms-and-conditions": page(
    "terms-and-conditions",
    text("Terms & Conditions", "শর্তাবলি"),
    text(
      "These terms explain the basic conditions for browsing, ordering, receiving, and contacting Mango Lover BD.",
      "এই শর্তাবলিতে ম্যাংগো লাভার বিডির ওয়েবসাইট ব্যবহার, অর্ডার, পণ্য গ্রহণ এবং যোগাযোগের মৌলিক নিয়মগুলো ব্যাখ্যা করা হয়েছে।",
    ),
    [
      section(
        text("Products and information", "পণ্য ও তথ্য"),
        text(
          "We try to keep product names, descriptions, prices, availability, images, and variants accurate. Product availability and prices may change without prior notice, and an item may become unavailable before an order is confirmed.",
          "আমরা পণ্যের নাম, বিবরণ, মূল্য, প্রাপ্যতা, ছবি ও ভ্যারিয়েন্ট সঠিক রাখার চেষ্টা করি। অগ্রিম নোটিশ ছাড়াই পণ্যের প্রাপ্যতা বা মূল্য পরিবর্তিত হতে পারে এবং অর্ডার কনফার্ম হওয়ার আগে কোনো পণ্য অনুপলব্ধ হতে পারে।",
        ),
      ),
      section(
        text("Orders and acceptance", "অর্ডার ও গ্রহণ"),
        text(
          "Submitting an order is a request to purchase. An order becomes confirmed when Mango Lover verifies the order and accepts it for dispatch. We may contact you to clarify details or decline an order that cannot be fulfilled.",
          "অর্ডার দেওয়া একটি পণ্য কেনার অনুরোধ। ম্যাংগো লাভার অর্ডার যাচাই করে ডিসপ্যাচের জন্য গ্রহণ করলে অর্ডার কনফার্ম হয়। তথ্য পরিষ্কার করতে বা পূরণ করা সম্ভব নয় এমন অর্ডার বাতিল করতে আমরা আপনার সঙ্গে যোগাযোগ করতে পারি।",
        ),
      ),
      section(
        text("Payment and delivery", "পেমেন্ট ও ডেলিভারি"),
        text(
          "Payment is Cash on Delivery only. Delivery costs ৳100 unless the order value is over ৳2600, in which case delivery is free. Estimated delivery is 1–2 days inside Dhaka and 2–3 days outside Dhaka.",
          "পেমেন্টের একমাত্র পদ্ধতি ক্যাশ অন ডেলিভারি। অর্ডারের মূল্য ৳২৬০০-এর বেশি না হলে ডেলিভারি চার্জ ৳১০০; ৳২৬০০-এর বেশি হলে ডেলিভারি ফ্রি। ঢাকার ভেতরে সম্ভাব্য সময় ১–২ দিন এবং ঢাকার বাইরে ২–৩ দিন।",
        ),
      ),
      section(
        text("Customer responsibility", "গ্রাহকের দায়িত্ব"),
        text(
          "Customers are responsible for providing accurate contact and delivery information, being available to receive the order, and checking the package on arrival. Customers must not misuse the website, submit false orders, or impersonate another person.",
          "সঠিক যোগাযোগ ও ডেলিভারি তথ্য দেওয়া, অর্ডার গ্রহণের জন্য উপস্থিত থাকা এবং প্যাকেজ হাতে পাওয়ার সময় যাচাই করা গ্রাহকের দায়িত্ব। ওয়েবসাইটের অপব্যবহার, ভুয়া অর্ডার বা অন্যের পরিচয় ব্যবহার করা যাবে না।",
        ),
      ),
      section(
        text("Changes to these terms", "শর্তাবলির পরিবর্তন"),
        text(
          "We may update these terms when our services, delivery process, or policies change. The latest version published on this website will apply to future use and orders.",
          "আমাদের সেবা, ডেলিভারি প্রক্রিয়া বা নীতিমালায় পরিবর্তন হলে আমরা এই শর্তাবলি আপডেট করতে পারি। ওয়েবসাইটে প্রকাশিত সর্বশেষ সংস্করণ ভবিষ্যৎ ব্যবহার ও অর্ডারের ক্ষেত্রে প্রযোজ্য হবে।",
        ),
      ),
    ],
  ),
  "privacy-policy": page(
    "privacy-policy",
    text("Privacy Policy", "গোপনীয়তা নীতিমালা"),
    text(
      "This policy explains what information Mango Lover may receive when you browse, contact us, or place an order.",
      "আপনি ব্রাউজ, যোগাযোগ বা অর্ডার করার সময় ম্যাংগো লাভার কী ধরনের তথ্য পেতে পারে, এই নীতিমালায় তা ব্যাখ্যা করা হয়েছে।",
    ),
    [
      section(
        text("Information you provide", "আপনার দেওয়া তথ্য"),
        text(
          "Depending on how you use the storefront, we may receive your name, phone number, email address, delivery address, order details, and messages sent to our support channels.",
          "আপনি কীভাবে স্টোরফ্রন্ট ব্যবহার করেন তার ওপর নির্ভর করে আমরা আপনার নাম, ফোন নম্বর, ইমেইল, ডেলিভারি ঠিকানা, অর্ডারের তথ্য এবং সাপোর্ট চ্যানেলে পাঠানো মেসেজ পেতে পারি।",
        ),
      ),
      section(
        text("How we use information", "তথ্য কীভাবে ব্যবহার করি"),
        text(
          "We use order and contact information to confirm orders, deliver products, answer questions, provide support, improve the storefront, and communicate service updates related to your request.",
          "অর্ডার কনফার্ম, পণ্য ডেলিভারি, প্রশ্নের উত্তর, সাপোর্ট, স্টোরফ্রন্ট উন্নত করা এবং আপনার অনুরোধ-সম্পর্কিত সেবা আপডেট জানাতে আমরা অর্ডার ও যোগাযোগের তথ্য ব্যবহার করি।",
        ),
      ),
      section(
        text("Incomplete checkout details", "অসম্পূর্ণ চেকআউটের তথ্য"),
        text(
          "During an incomplete checkout, if you enter a valid phone number but do not place an order, we may keep the checkout details you provided, including selected items, for up to 30 days so our team can offer manual assistance. We do not send automated recovery messages or use these details for advertising audiences.",
          "অসম্পূর্ণ চেকআউটের সময় বৈধ ফোন নম্বর দিলেও অর্ডার সম্পন্ন না করলে, আমাদের টিমের ম্যানুয়াল সহায়তার জন্য আপনার দেওয়া চেকআউটের তথ্য ও নির্বাচিত পণ্য সর্বোচ্চ ৩০ দিন রাখা হতে পারে। আমরা স্বয়ংক্রিয় রিকভারি বার্তা পাঠাই না এবং বিজ্ঞাপনের অডিয়েন্স তৈরিতে এই তথ্য ব্যবহার করি না।",
        ),
      ),
      section(
        text("Sharing and service providers", "তথ্য শেয়ার ও সেবা প্রদানকারী"),
        text(
          "We may share the information needed to fulfill an order with delivery or technology service providers working for Mango Lover. We do not sell customer information. We may disclose information when required to prevent fraud, protect our service, or comply with applicable law.",
          "অর্ডার পূরণ করতে প্রয়োজনীয় তথ্য ম্যাংগো লাভারের হয়ে কাজ করা ডেলিভারি বা প্রযুক্তি সেবা প্রদানকারীর সঙ্গে শেয়ার করা হতে পারে। আমরা গ্রাহকের তথ্য বিক্রি করি না। জালিয়াতি রোধ, সেবা সুরক্ষা বা প্রযোজ্য আইন মেনে চলার জন্য প্রয়োজন হলে তথ্য প্রকাশ করা হতে পারে।",
        ),
      ),
      section(
        text("Cookies and browser storage", "কুকি ও ব্রাউজার স্টোরেজ"),
        text(
          "The storefront may use cookies or browser storage for necessary functions such as cart, recently viewed products, preferences, analytics, or advertising measurement. You can manage storage through your browser settings, but some features may not work correctly afterward.",
          "কার্ট, সম্প্রতি দেখা পণ্য, পছন্দ, অ্যানালিটিক্স বা বিজ্ঞাপনের পরিমাপের মতো প্রয়োজনীয় কাজে স্টোরফ্রন্ট কুকি বা ব্রাউজার স্টোরেজ ব্যবহার করতে পারে। ব্রাউজারের সেটিংস থেকে স্টোরেজ নিয়ন্ত্রণ করা যায়, তবে এতে কিছু ফিচার সঠিকভাবে কাজ নাও করতে পারে।",
        ),
      ),
      section(
        text("Your questions", "আপনার প্রশ্ন"),
        text(
          `For privacy questions or requests about your information, contact us at ${CONTACT_DETAILS.email}.`,
          `গোপনীয়তা বা আপনার তথ্য-সম্পর্কিত প্রশ্ন ও অনুরোধের জন্য ${CONTACT_DETAILS.email} ঠিকানায় যোগাযোগ করুন।`,
        ),
      ),
    ],
  ),
  "refund-return-exchange": page(
    "refund-return-exchange",
    text("Refund, Return & Exchange Policy", "রিফান্ড, রিটার্ন ও এক্সচেঞ্জ নীতিমালা"),
    text(
      "Because our products are food items, we handle returns carefully and only for qualifying product problems.",
      "আমাদের পণ্য খাদ্যপণ্য হওয়ায় নির্দিষ্ট পণ্যের সমস্যার ক্ষেত্রে সতর্কতার সঙ্গে রিটার্ন পরিচালনা করা হয়।",
    ),
    [
      section(
        text("When a return may be accepted", "কখন রিটার্ন গ্রহণ করা হতে পারে"),
        text(
          "A return or replacement may be considered when the item arrives damaged, spoiled, or different from the item ordered. Contact us within 24 hours of delivery.",
          "পণ্য ডেলিভারির সময় ক্ষতিগ্রস্ত, নষ্ট বা অর্ডার করা পণ্যের বদলে অন্য পণ্য এলে রিটার্ন বা রিপ্লেসমেন্ট বিবেচনা করা হতে পারে। ডেলিভারির ২৪ ঘণ্টার মধ্যে যোগাযোগ করুন।",
        ),
      ),
      section(
        text("Proof and condition", "প্রমাণ ও পণ্যের অবস্থা"),
        text(
          "Send clear unboxing photos or video, a photo of the product and packaging, your order details, and a description of the issue. Opened, used, or partially consumed products are generally not eligible unless the issue could not reasonably be identified before opening.",
          "পরিষ্কার আনবক্সিংয়ের ছবি বা ভিডিও, পণ্য ও প্যাকেজিংয়ের ছবি, অর্ডারের তথ্য এবং সমস্যার বিবরণ পাঠান। খোলা, ব্যবহৃত বা আংশিক খাওয়া পণ্য সাধারণত রিটার্নযোগ্য নয়, তবে খোলার আগে সমস্যা বোঝা সম্ভব না হলে বিষয়টি আলাদাভাবে বিবেচনা করা হতে পারে।",
        ),
      ),
      section(
        text("Review and resolution", "পর্যালোচনা ও সমাধান"),
        text(
          "Our team will review the evidence and may ask follow-up questions. Depending on the situation, we may arrange a replacement, collect the item, or approve another reasonable resolution. Refunds, when approved, will be discussed directly with the customer.",
          "আমাদের টিম প্রমাণ পর্যালোচনা করে প্রয়োজনে অতিরিক্ত তথ্য চাইতে পারে। পরিস্থিতি অনুযায়ী রিপ্লেসমেন্ট, পণ্য ফেরত নেওয়া বা অন্য উপযুক্ত সমাধানের ব্যবস্থা করা হতে পারে। রিফান্ড অনুমোদিত হলে তা গ্রাহকের সঙ্গে সরাসরি আলোচনা করা হবে।",
        ),
      ),
      section(
        text("Change-of-mind returns", "পছন্দ পরিবর্তনের রিটার্ন"),
        text(
          "We do not normally accept returns because a customer changed their mind, ordered the wrong item, or no longer wants a food product after delivery.",
          "শুধু পছন্দ পরিবর্তন, ভুল পণ্য অর্ডার বা ডেলিভারির পর খাদ্যপণ্য আর না চাওয়ার কারণে সাধারণত রিটার্ন গ্রহণ করা হয় না।",
        ),
      ),
    ],
  ),
  "cancellation-policy": page(
    "cancellation-policy",
    text("Cancellation Policy", "অর্ডার বাতিল নীতিমালা"),
    text(
      "We understand that plans can change. Cancellation depends on whether an order has already been dispatched.",
      "পরিকল্পনা পরিবর্তন হতে পারে—আমরা তা বুঝি। অর্ডার ডিসপ্যাচ হয়েছে কি না, তার ওপর বাতিলের সুযোগ নির্ভর করে।",
    ),
    [
      section(
        text("Before dispatch", "ডিসপ্যাচের আগে"),
        text(
          "You may request cancellation before the order is dispatched. Contact us by phone or WhatsApp as soon as possible and provide your name, phone number, and order details.",
          "অর্ডার ডিসপ্যাচ হওয়ার আগে বাতিলের অনুরোধ করা যায়। যত দ্রুত সম্ভব ফোন বা হোয়াটসঅ্যাপে আপনার নাম, ফোন নম্বর ও অর্ডারের তথ্য দিয়ে যোগাযোগ করুন।",
        ),
      ),
      section(
        text("After dispatch", "ডিসপ্যাচের পরে"),
        text(
          "Once an order has been dispatched, it cannot normally be cancelled. Please receive the package and contact us if there is a qualifying damaged, spoiled, or incorrect-item issue.",
          "অর্ডার ডিসপ্যাচ হওয়ার পর সাধারণত তা বাতিল করা যায় না। প্যাকেজ গ্রহণ করে ক্ষতিগ্রস্ত, নষ্ট বা ভুল পণ্যের সমস্যা থাকলে রিটার্ন নীতিমালা অনুযায়ী যোগাযোগ করুন।",
        ),
      ),
      section(
        text("Failed delivery or refusal", "ডেলিভারি ব্যর্থতা বা গ্রহণে অস্বীকৃতি"),
        text(
          "Repeated failed delivery attempts, an unreachable phone number, an incorrect address, or refusing a confirmed Cash on Delivery order may affect future order acceptance.",
          "বারবার ডেলিভারি ব্যর্থ হওয়া, ফোনে যোগাযোগ না পাওয়া, ভুল ঠিকানা বা কনফার্ম করা ক্যাশ অন ডেলিভারি অর্ডার গ্রহণে অস্বীকৃতি ভবিষ্যৎ অর্ডার গ্রহণের ওপর প্রভাব ফেলতে পারে।",
        ),
      ),
    ],
  ),
  "faq": page(
    "faq",
    text("Frequently Asked Questions", "সাধারণ জিজ্ঞাসা"),
    text(
      "Find quick answers about ordering, payment, delivery, and product issues.",
      "অর্ডার, পেমেন্ট, ডেলিভারি ও পণ্যের সমস্যা সম্পর্কে দ্রুত উত্তর খুঁজে নিন।",
    ),
    [
      section(
        text("What payment methods do you accept?", "আপনারা কোন পেমেন্ট পদ্ধতি গ্রহণ করেন?"),
        text("Mango Lover currently accepts Cash on Delivery only.", "ম্যাংগো লাভারে বর্তমানে শুধু ক্যাশ অন ডেলিভারি গ্রহণ করা হয়।"),
      ),
      section(
        text("How much is delivery?", "ডেলিভারি চার্জ কত?"),
        text("Delivery is ৳100 for orders up to ৳2600 and free for orders over ৳2600.", "৳২৬০০ পর্যন্ত অর্ডারে ডেলিভারি চার্জ ৳১০০ এবং ৳২৬০০-এর বেশি অর্ডারে ডেলিভারি ফ্রি।"),
      ),
      section(
        text("How long does delivery take?", "ডেলিভারি হতে কত সময় লাগে?"),
        text("Inside Dhaka usually takes 1–2 days; outside Dhaka usually takes 2–3 days.", "ঢাকার ভেতরে সাধারণত ১–২ দিন এবং ঢাকার বাইরে সাধারণত ২–৩ দিন সময় লাগে।"),
      ),
      section(
        text("Can I cancel my order?", "আমি কি অর্ডার বাতিল করতে পারি?"),
        text("Yes, before dispatch. Contact us by phone or WhatsApp as soon as possible.", "হ্যাঁ, ডিসপ্যাচের আগে। যত দ্রুত সম্ভব ফোন বা হোয়াটসঅ্যাপে যোগাযোগ করুন।"),
      ),
      section(
        text("What if my food product arrives damaged or spoiled?", "খাদ্যপণ্য ক্ষতিগ্রস্ত বা নষ্ট অবস্থায় এলে কী করব?"),
        text("Contact us within 24 hours with unboxing photo or video and your order details.", "আনবক্সিংয়ের ছবি বা ভিডিও ও অর্ডারের তথ্যসহ ২৪ ঘণ্টার মধ্যে আমাদের জানান।"),
      ),
    ],
  ),
  "track-order": page(
    "track-order",
    text("Track Your Order", "অর্ডার ট্র্যাক করুন"),
    text(
      "Our support team can help you check the latest status of your Mango Lover order.",
      "ম্যাংগো লাভারের অর্ডারের সর্বশেষ অবস্থা জানতে আমাদের সাপোর্ট টিম আপনাকে সাহায্য করতে পারে।",
    ),
    [
      section(
        text("How to request an update", "আপডেট কীভাবে জানতে পারবেন"),
        text(
          `Call ${CONTACT_DETAILS.phone} or message us on WhatsApp at ${CONTACT_DETAILS.whatsapp}. Share the phone number used for the order and your order reference if you have it.`,
          `আমাদের ${CONTACT_DETAILS.phone} নম্বরে কল করুন অথবা ${CONTACT_DETAILS.whatsapp} নম্বরে হোয়াটসঅ্যাপে মেসেজ দিন। অর্ডারে ব্যবহৃত ফোন নম্বর এবং অর্ডার রেফারেন্স থাকলে তা পাঠান।`,
        ),
      ),
      section(
        text("What we can help with", "যে বিষয়গুলোতে আমরা সাহায্য করতে পারি"),
        text(
          "We can help confirm whether an order is received, being prepared, dispatched, or delayed. Delivery estimates are 1–2 days inside Dhaka and 2–3 days outside Dhaka.",
          "অর্ডার গ্রহণ হয়েছে কি না, প্রস্তুত হচ্ছে কি না, ডিসপ্যাচ হয়েছে কি না বা দেরি হচ্ছে কি না—এসব বিষয়ে আমরা জানাতে পারি। ঢাকার ভেতরে সম্ভাব্য সময় ১–২ দিন এবং ঢাকার বাইরে ২–৩ দিন।",
        ),
      ),
      section(
        text("Keep your phone available", "ফোন সচল রাখুন"),
        text(
          "Our team or delivery partner may call to confirm directions or arrange delivery. Please keep the phone number from your order active until the package is received.",
          "ঠিকানা নিশ্চিত করতে বা ডেলিভারি দেওয়ার জন্য আমাদের টিম বা ডেলিভারি পার্টনার ফোন করতে পারে। প্যাকেজ হাতে পাওয়া পর্যন্ত অর্ডারে দেওয়া ফোন নম্বর সচল রাখুন।",
        ),
      ),
    ],
  ),
} as const satisfies Record<string, SitePage>;
