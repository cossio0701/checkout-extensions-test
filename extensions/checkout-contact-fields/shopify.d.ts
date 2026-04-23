import '@shopify/ui-extensions';

//@ts-ignore
declare module './src/Checkout.jsx' {
  const shopify: import('@shopify/ui-extensions/purchase.checkout.contact.render-after').Api;
  const globalThis: { shopify: typeof shopify };
}

//@ts-ignore
declare module './src/customer-metafields.js' {
  const shopify: import('@shopify/ui-extensions/purchase.checkout.contact.render-after').Api;
  const globalThis: { shopify: typeof shopify };
}

//@ts-ignore
declare module './src/doc-validation.js' {
  const shopify: import('@shopify/ui-extensions/purchase.checkout.contact.render-after').Api;
  const globalThis: { shopify: typeof shopify };
}
