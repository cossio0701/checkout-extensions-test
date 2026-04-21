# Shopify Checkout — Alcances y conceptos clave

Guía de referencia rápida de los conceptos del ecosistema de Shopify Checkout: qué se puede extender, cómo se extiende, y dónde leer más.

> **Nota**: los links apuntan a la documentación oficial de Shopify (`shopify.dev`). Las rutas pueden cambiar con nuevas versiones de API — si alguna da 404, buscar el nombre del concepto en shopify.dev.

---

## 1. Checkout UI Extensions

Son bloques de UI que se inyectan en puntos específicos del checkout. Lo que estamos usando en este proyecto.

### Conceptos
- **Targets** (o "extension points"): lugares específicos del checkout donde podés renderizar UI. Ej: `purchase.checkout.contact.render-after`, `purchase.checkout.block.render`, `purchase.checkout.delivery-address.render-before`, etc.
- **API versioning**: cada extension declara una `api_version` (ej. `2026-01`) que determina qué features y componentes están disponibles.
- **Web components / Preact**: Shopify provee componentes nativos (`s-text-field`, `s-select`, `s-banner`, `s-checkbox`, `s-stack`, `s-grid`, etc.) que se usan dentro de Preact/React.

### Capabilities
Flags que habilitan comportamientos especiales:
- `block_progress` → permite bloquear el avance del checkout (lo usamos en los intercepts de contact-fields y data-consent).
- `api_access` → acceso a la API GraphQL de Shopify desde la extension.
- `network_access` → permite llamadas HTTP a dominios externos.
- `iframe` → permite embeber iframes.

### Hooks / APIs principales
- `useBuyerJourneyIntercept` — bloquear el avance del checkout con una razón.
- `useAttributeValues` — leer atributos actuales del checkout.
- `useApplyAttributeChange` / `shopify.applyAttributeChange` — escribir atributos.
- `useShippingAddress`, `useBillingAddress` — acceso reactivo a direcciones.
- `useCart`, `useCartLines` — líneas del carrito.
- `useCustomer` — datos del cliente logueado.
- `useEmail`, `usePhone` — campos de contacto.
- `useLocalizationCountry`, `useLocalizationLanguage` — locale del comprador.
- `shopify.i18n.translate` — traducción desde archivos `locales/*.json`.

### Documentación
- Índice general: https://shopify.dev/docs/api/checkout-ui-extensions
- Targets disponibles: https://shopify.dev/docs/api/checkout-ui-extensions/unstable/extension-targets-api
- Componentes UI: https://shopify.dev/docs/api/checkout-ui-extensions/unstable/components
- Hooks de API: https://shopify.dev/docs/api/checkout-ui-extensions/unstable/apis
- Configuración (`shopify.extension.toml`): https://shopify.dev/docs/apps/build/app-extensions/configure-app-extensions

---

## 2. Checkout Attributes (lo que estamos usando para persistir datos)

Son **pares clave-valor** asociados al checkout/carrito, persistidos en los servidores de Shopify. Sobreviven a recargas y navegación.

### Características
- Se guardan con `applyAttributeChange({ type: "updateAttribute", key, value })`.
- Se leen reactivamente con `useAttributeValues(["key1", "key2"])`.
- Aparecen en la orden final como **`note_attributes`** (admin, webhooks `orders/create`, exports, etc.).
- Son **string-only** (convertir objetos a JSON si hace falta).
- No son privados — cualquier app con acceso al checkout puede leerlos.

### Conceptos relacionados
- **Cart attributes** (equivalente del lado del storefront, antes del checkout).
- **Cart notes** — campo único de texto libre asociado al carrito.
- **Line item properties** — atributos por línea de producto.
- **Metafields** — datos estructurados que se asocian a productos, customers, orders, etc. Persisten más allá del checkout.

### Documentación
- Checkout attributes API: https://shopify.dev/docs/api/checkout-ui-extensions/unstable/apis/attributes
- Storefront cart attributes: https://shopify.dev/docs/api/ajax/reference/cart
- Metafields overview: https://shopify.dev/docs/apps/build/custom-data/metafields
- Note attributes en orden: https://shopify.dev/docs/api/admin-graphql/unstable/objects/Order (campo `customAttributes`)

---

## 3. Shopify Functions

Código serverless (Rust o JavaScript compilado a WASM) que **modifica comportamiento del checkout de forma programática**. Se ejecutan en la infraestructura de Shopify, no en el cliente.

### Tipos principales
- **Delivery customization** — reordenar, renombrar u ocultar métodos de envío.
- **Payment customization** — reordenar, renombrar u ocultar métodos de pago (ej. ocultar COD si el carrito supera cierto monto).
- **Discount** — crear lógica de descuento custom (ej. "3x2 en productos con tag X").
- **Cart transform** — agrupar, expandir o modificar líneas del carrito (ej. productos bundle).
- **Order routing / Fulfillment constraints** — reglas de fulfillment.
- **Checkout validation** — validaciones server-side del checkout (ej. validar documento contra una API externa).

### Vs. UI Extensions
- **UI Extensions** corren en el navegador, manejan UI y validaciones ligeras.
- **Functions** corren en servidor, son determinísticas, sin UI, y afectan lógica de negocio (precios, envíos, pagos).

### Documentación
- Índice Functions: https://shopify.dev/docs/api/functions
- Tipos de function: https://shopify.dev/docs/apps/build/functions
- Checkout validation: https://shopify.dev/docs/api/functions/latest/cart-checkout-validation

---

## 4. Checkout Branding API

Permite personalizar la **apariencia** del checkout (colores, tipografías, logos, bordes, espaciados) por programa — sin tocar UI extensions.

### Documentación
- Checkout branding: https://shopify.dev/docs/apps/build/checkout/styling/checkout-branding

---

## 5. Post-Purchase Extensions

Extensions que aparecen **después de pagar pero antes de la página de "Thank you"**. Típicamente se usan para upsells, encuestas, o cross-sells.

### Características
- Pueden agregar productos a la orden sin que el comprador re-ingrese pagos (bajo ciertas condiciones).
- Corren en su propio iframe seguro.
- Límite de ~1-2 extensions post-purchase por checkout.

### Documentación
- Post-purchase: https://shopify.dev/docs/api/checkout-extensions/post-purchase

---

## 6. Otros tipos de extensions en el mismo CLI

El mismo CLI (`shopify app`) también genera estos tipos, que no son del checkout pero conviene conocerlos:

- **Admin UI Extensions** — UI dentro del admin de Shopify (bloques custom en páginas de producto, orden, etc.).
- **Customer Account UI Extensions** — UI en las páginas "Mi cuenta" del cliente.
- **POS UI Extensions** — UI en el POS de Shopify.
- **Theme App Extensions** — bloques que el merchant puede insertar en el theme vía editor.
- **Web Pixel** — tracking de eventos del storefront.
- **Flow Actions / Triggers** — acciones y triggers custom para Shopify Flow.

### Documentación
- Catálogo de extensions: https://shopify.dev/docs/apps/build/app-extensions
- Admin extensions: https://shopify.dev/docs/api/admin-extensions
- Customer account: https://shopify.dev/docs/api/customer-account-ui-extensions

---

## 7. Limitaciones típicas del checkout a tener en cuenta

- **No se puede acceder a `window`/`document` globales libremente** — las extensions corren en sandbox.
- **No hay cookies ni localStorage de terceros** — usar checkout attributes o metafields.
- **`network_access` requiere aprobación de Shopify** para apps públicas.
- **Los targets disponibles dependen del plan de la tienda** — Shopify Plus habilita más lugares (checkout extensibility completa).
- **Solo 1 extension de un mismo target puede estar "pinned"** en el checkout simultáneamente (en tiendas no-Plus).
- **Performance**: cada `applyAttributeChange` es un request a Shopify → **evitar llamadas por keystroke**, usar debouncing.

### Documentación
- Limits y best practices: https://shopify.dev/docs/apps/build/checkout/best-practices

---

## 8. Tooling y workflow

- **Shopify CLI**: `shopify app dev` (servidor local con tunnel), `shopify app deploy` (publica extensions), `shopify app generate extension` (scaffolding).
- **Partners Dashboard**: https://partners.shopify.com — crear apps, gestionar credenciales, instalar en tiendas dev.
- **Development stores**: tiendas gratuitas para desarrollo/pruebas.
- **GraphiQL app** (en admin): testear queries GraphQL contra la tienda.

### Documentación
- Shopify CLI: https://shopify.dev/docs/api/shopify-cli
- Build checkout apps: https://shopify.dev/docs/apps/build/checkout
- Development stores: https://shopify.dev/docs/apps/tools/development-stores

---

## 9. Glosario rápido

| Término | Qué es |
|---|---|
| **Target** | Punto del checkout donde una extension se renderiza (ej. `purchase.checkout.contact.render-after`). |
| **Capability** | Flag que habilita un comportamiento (ej. `block_progress`). |
| **Attribute** | Par clave-valor del checkout persistido en Shopify. |
| **Metafield** | Dato estructurado asociado a una entidad (producto, customer, orden). Más potente que attribute, con namespace y tipo. |
| **Function** | Código WASM que corre en servidor y afecta lógica del checkout. |
| **Intercept** | Mecanismo que bloquea el avance del checkout con una razón (`useBuyerJourneyIntercept`). |
| **Checkout extensibility** | Término general para la arquitectura moderna de extensiones del checkout (vs. el antiguo `checkout.liquid`). |
| **Checkout.liquid** | Sistema legacy de customización basado en templates Liquid (deprecated para Plus en 2024). |

---

## 10. Siguientes pasos sugeridos para explorar

1. **Leer**: https://shopify.dev/docs/apps/build/checkout/overview — overview general.
2. **Probar un Shopify Function**: `shopify app generate extension` → elegir `cart-checkout-validation` o `delivery-customization`.
3. **Ver todos los targets disponibles** para la versión de API que usás: https://shopify.dev/docs/api/checkout-ui-extensions/unstable/extension-targets-api
4. **Revisar ejemplos oficiales**: https://github.com/Shopify/checkout-ui-extensions-samples
