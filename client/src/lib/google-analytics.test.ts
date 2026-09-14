import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildGoogleEcommercePayload,
  parseCurrencyAmount,
  toGoogleAnalyticsItem,
  trackGoogleEcommerceEvent,
  type GoogleAnalyticsWindow,
  type GoogleEcommerceEventName,
} from "./google-analytics.ts";

test("normalizes storefront items into the merchant team's GA4 item shape", () => {
  assert.deepEqual(
    toGoogleAnalyticsItem({
      id: "mango-himsagar",
      name: "Himsagar Mango",
      variant: "10kg",
      price: 1850,
      quantity: 2,
    }),
    {
      item_id: "mango-himsagar",
      item_name: "Himsagar Mango — 10kg",
      item_brand: "Mango Lover BD",
      item_category: "",
      item_variant: "10kg",
      item_list_name: "",
      item_list_id: "",
      price: 1850,
      discount: 0,
      index: 0,
      quantity: 2,
    },
  );
});

test("builds a GTM ecommerce event with nested ecommerce parameters", () => {
  const payload = buildGoogleEcommercePayload({
    event: "view_item",
    pageType: "product",
    title: "Himsagar Mango | Mango Lover BD",
    url: "https://mangoloverbd.vercel.app/product/himsagar-mango?utm=1",
    language: "en",
    value: 1850,
    items: [
      toGoogleAnalyticsItem({
        id: "mango-himsagar",
        name: "Himsagar Mango",
        variant: "10kg",
        price: 1850,
        quantity: 1,
      }),
    ],
  });

  assert.deepEqual(payload, {
    event: "view_item",
    page_type: "product",
    page_title: "Himsagar Mango | Mango Lover BD",
    page_url: "https://mangoloverbd.vercel.app/product/himsagar-mango",
    page_path: "/product/himsagar-mango",
    page_language: "en",
    logged_in: false,
    customer_id: null,
    ecommerce: {
      currency: "BDT",
      value: 1850,
      transaction_id: "",
      affiliation: "",
      tax: 0,
      shipping: 0,
      coupon: "",
      items: [
        {
          item_id: "mango-himsagar",
          item_name: "Himsagar Mango — 10kg",
          item_brand: "Mango Lover BD",
          item_category: "",
          item_variant: "10kg",
          item_list_name: "",
          item_list_id: "",
          price: 1850,
          discount: 0,
          index: 0,
          quantity: 1,
        },
      ],
    },
  });
});

test("omits query and hash values from GTM page URLs", () => {
  const payload = buildGoogleEcommercePayload({
    event: "view_item",
    pageType: "product",
    url: "https://mangoloverbd.vercel.app/product/himsagar-mango?contact=private-value#delivery",
    value: 1850,
    items: [],
  });

  assert.equal(payload.page_url, "https://mangoloverbd.vercel.app/product/himsagar-mango");
  assert.equal(payload.page_path, "/product/himsagar-mango");
});

test("pushes one GTM ecommerce event with ecommerce.value and ecommerce.currency", () => {
  const target: GoogleAnalyticsWindow = {
    dataLayer: [],
    location: new URL("https://mangoloverbd.vercel.app/checkout"),
    document: { title: "Checkout | Mango Lover BD", documentElement: { lang: "en" } },
  };

  trackGoogleEcommerceEvent(
    "begin_checkout",
    {
      pageType: "checkout",
      value: 1850,
      items: [toGoogleAnalyticsItem({ id: "mango-himsagar", name: "Himsagar Mango", price: 1850 })],
    },
    target,
  );

  assert.deepEqual(target.dataLayer, [
    {
      event: "begin_checkout",
      page_type: "checkout",
      page_title: "Checkout | Mango Lover BD",
      page_url: "https://mangoloverbd.vercel.app/checkout",
      page_path: "/checkout",
      page_language: "en",
      logged_in: false,
      customer_id: null,
      ecommerce: {
        currency: "BDT",
        value: 1850,
        transaction_id: "",
        affiliation: "",
        tax: 0,
        shipping: 0,
        coupon: "",
        items: [
          {
            item_id: "mango-himsagar",
            item_name: "Himsagar Mango",
            item_brand: "Mango Lover BD",
            item_category: "",
            item_variant: "",
            item_list_name: "",
            item_list_id: "",
            price: 1850,
            discount: 0,
            index: 0,
            quantity: 1,
          },
        ],
      },
    },
  ]);
});

test("uses the GA4 select_item ecommerce shape for a selected live pack", () => {
  const event: GoogleEcommerceEventName = "select_item";
  const target: GoogleAnalyticsWindow = {
    dataLayer: [],
    location: new URL("https://mangoloverbd.vercel.app/step/sundarbans-natural-honey"),
    document: { title: "Sundarbans Honey", documentElement: { lang: "bn" } },
  };

  const payload = trackGoogleEcommerceEvent(event, {
    pageType: "product",
    value: 1600,
    items: [toGoogleAnalyticsItem({
      id: "honey-1kg",
      name: "Sundarbans Natural Honey",
      variant: "1KG",
      price: 1600,
      quantity: 2,
    })],
  }, target);

  assert.deepEqual(payload?.ecommerce.items, [{
    item_id: "honey-1kg",
    item_name: "Sundarbans Natural Honey — 1KG",
    item_brand: "Mango Lover BD",
    item_category: "",
    item_variant: "1KG",
    item_list_name: "",
    item_list_id: "",
    price: 1600,
    discount: 0,
    index: 0,
    quantity: 2,
  }]);
  assert.equal(payload?.event, "select_item");
  assert.equal(payload?.ecommerce.value, 1600);
});

test("parses visible taka prices into GA4 numbers", () => {
  assert.equal(parseCurrencyAmount("৳1,850"), 1850);
  assert.equal(parseCurrencyAmount("BDT 1,850.50"), 1850.5);
  assert.equal(parseCurrencyAmount("Select Items"), 0);
});

test("builds the merchant purchase shape with transaction, shipping, and customer", () => {
  const target: GoogleAnalyticsWindow = { dataLayer: [] };

  const payload = trackGoogleEcommerceEvent("purchase", {
    pageType: "thank_you",
    value: 1942,
    transactionId: "ML-1001",
    affiliation: "",
    tax: 0,
    shipping: 150,
    coupon: "",
    customer: { name: "Test Customer", phone: "01712345678", address: "House 12 Savar Dhaka" },
    items: [toGoogleAnalyticsItem({
      id: "honey-1kg",
      name: "Sundarbans Natural Honey",
      variant: "1KG",
      price: 896,
      quantity: 2,
    })],
  }, target);

  assert.deepEqual(payload?.ecommerce, {
    currency: "BDT",
    value: 1942,
    transaction_id: "ML-1001",
    affiliation: "",
    tax: 0,
    shipping: 150,
    coupon: "",
    customer: { name: "Test Customer", phone: "01712345678", address: "House 12 Savar Dhaka" },
    items: [{
      item_id: "honey-1kg",
      item_name: "Sundarbans Natural Honey — 1KG",
      item_brand: "Mango Lover BD",
      item_category: "",
      item_variant: "1KG",
      item_list_name: "",
      item_list_id: "",
      price: 896,
      discount: 0,
      index: 0,
      quantity: 2,
    }],
  });
  assert.equal(payload?.event, "purchase");
  assert.equal(target.dataLayer?.length, 1);
});
