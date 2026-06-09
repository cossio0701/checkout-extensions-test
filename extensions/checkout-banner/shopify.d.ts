import '@shopify/ui-extensions';

//@ts-ignore
declare module './src/Banner.jsx' {
  const shopify: import('@shopify/ui-extensions/purchase.checkout.header.render-after').Api;
  const globalThis: { shopify: typeof shopify };
}
