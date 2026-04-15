# Shopify Checkout UI Extension — Targets disponibles

Los targets definen en qué zona del checkout se inyecta tu extensión.
Se configuran en `shopify.extension.toml` bajo `[[extensions.targeting]]`.

```toml
[[extensions.targeting]]
module = "./src/Checkout.jsx"
target = "purchase.checkout.contact.render-after"
```

---

## Estructura del nombre

```
purchase.checkout.[sección].[posición]
```

- **purchase.checkout** — prefijo fijo para el checkout
- **sección** — parte del checkout donde se inyecta
- **posición** — `render-before`, `render-after`, o `render` (reemplaza/ocupa el slot)

---

## Checkout — Targets disponibles

### Contacto y dirección

| Target | Dónde aparece |
|--------|--------------|
| `purchase.checkout.contact.render-after` | Después del campo de email |
| `purchase.checkout.delivery-address.render-before` | Antes del formulario de dirección de envío |
| `purchase.checkout.delivery-address.render-after` | Después del formulario de dirección de envío |

### Envío

| Target | Dónde aparece |
|--------|--------------|
| `purchase.checkout.shipping-option-list.render-before` | Antes de la lista de opciones de envío |
| `purchase.checkout.shipping-option-list.render-after` | Después de la lista de opciones de envío |
| `purchase.checkout.shipping-option-item.render-after` | Después de cada opción de envío individual |
| `purchase.checkout.shipping-option-item.details.render` | Dentro del detalle expandido de cada opción |

### Pickup (recogida en tienda / puntos de entrega)

| Target | Dónde aparece |
|--------|--------------|
| `purchase.checkout.pickup-location-list.render-before` | Antes de la lista de puntos de recogida |
| `purchase.checkout.pickup-location-list.render-after` | Después de la lista de puntos de recogida |
| `purchase.checkout.pickup-location-option-item.render-after` | Después de cada punto de recogida individual |
| `purchase.checkout.pickup-point-list.render-before` | Antes de los puntos de envío cercanos |
| `purchase.checkout.pickup-point-list.render-after` | Después de los puntos de envío cercanos |

### Pago

| Target | Dónde aparece |
|--------|--------------|
| `purchase.checkout.payment-method-list.render-before` | Antes de la lista de métodos de pago |
| `purchase.checkout.payment-method-list.render-after` | Después de la lista de métodos de pago |
| `purchase.checkout.payment-option-item.details.render` | Dentro del detalle de cada método de pago |
| `purchase.checkout.payment-option-item.hosted-fields.render-after` | Después de los campos del método de pago (ej. tarjeta) |
| `purchase.checkout.payment-option-item.action-required.render` | Cuando se requiere acción adicional (ej. autenticación 3DS) |

### Carrito y descuentos

| Target | Dónde aparece |
|--------|--------------|
| `purchase.checkout.cart-line-list.render-after` | Después de la lista completa de productos |
| `purchase.checkout.cart-line-item.render-after` | Después de cada producto en el carrito |
| `purchase.checkout.reductions.render-before` | Antes del campo de cupones/descuentos |
| `purchase.checkout.reductions.render-after` | Después del campo de cupones/descuentos |
| `purchase.checkout.gift-card.render` | En la sección de gift cards |

### General

| Target | Dónde aparece |
|--------|--------------|
| `purchase.checkout.header.render-after` | Después del header del checkout |
| `purchase.checkout.footer.render-after` | Después del footer del checkout |
| `purchase.checkout.actions.render-before` | Antes del botón "Pagar" |
| `purchase.checkout.block.render` | Bloque sin posición fija — el merchant lo ubica manualmente en el editor |

---

## Thank You page — Targets disponibles

Estos targets se activan en la página de confirmación del pedido.

| Target | Dónde aparece |
|--------|--------------|
| `purchase.thank-you.header.render-after` | Después del header |
| `purchase.thank-you.footer.render-after` | Después del footer |
| `purchase.thank-you.cart-line-list.render-after` | Después de la lista de productos del pedido |
| `purchase.thank-you.cart-line-item.render-after` | Después de cada producto del pedido |
| `purchase.thank-you.customer-information.render-after` | Después del bloque de datos del cliente |
| `purchase.thank-you.block.render` | Bloque posicionable manualmente por el merchant |
| `purchase.thank-you.announcement.render` | Sección de anuncio o mensaje personalizado |

---

## Notas importantes

### Una extensión puede tener múltiples targets

```toml
[[extensions.targeting]]
module = "./src/ContactFields.jsx"
target = "purchase.checkout.contact.render-after"

[[extensions.targeting]]
module = "./src/ShippingFields.jsx"
target = "purchase.checkout.shipping-option-list.render-before"
```

### `*.block.render` — target especial

Los targets de tipo `block.render` no tienen una posición fija en el checkout. En cambio, el merchant los arrastra y posiciona manualmente desde el **Checkout Editor** en el admin de Shopify. Son útiles para elementos opcionales o promocionales.

### Capacidades adicionales en el `.toml`

```toml
[extensions.capabilities]
block_progress = true   # permite bloquear el avance del checkout (validaciones)
network_access = true   # permite hacer fetch a APIs externas
```

### Fuente

Definiciones de tipos en:
`node_modules/@shopify/ui-extensions/build/ts/surfaces/checkout/extension-targets.d.ts`

Documentación oficial:
https://shopify.dev/docs/api/checkout-ui-extensions/targets
