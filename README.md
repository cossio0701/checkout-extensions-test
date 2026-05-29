# checkout-extensions

App de **Shopify Checkout UI Extensions** (extensions-only, hospedada por
Shopify, sin backend propio) para tiendas de LATAM. Agrega al checkout nativo
los campos de contacto locales (tipo y número de documento, celular) y el
checkbox de consentimiento de tratamiento de datos, con validación por país.

> Esta app es **extensions-only**: no tiene App Home, ni auth, ni webhooks, ni
> servidor. Todo corre dentro del checkout que hospeda Shopify. La
> configuración por tienda viaja en un **metafield de tienda**, no en un backend.

## Extensiones

| Extensión | Target del checkout | Qué hace |
|-----------|---------------------|----------|
| [`checkout-contact-fields`](extensions/checkout-contact-fields) | `purchase.checkout.contact.render-after` | Renderiza tipo de documento + número + celular, valida por país y bloquea el avance si faltan o son inválidos. |
| [`checkout-data-consent`](extensions/checkout-data-consent) | `purchase.checkout.actions.render-before` | Checkbox de consentimiento de datos personales, con link a la política. |

Ambas pre-llenan datos desde los metafields del cliente cuando hay sesión
iniciada, y limpian esos datos al cerrar sesión o cambiar de cuenta (marker
`*_owner`) para no filtrar PII entre compradores.

## Configuración por tienda — el modelo

El principio que rige toda la app:

> **El metafield lleva DATOS (qué se muestra). El código lleva LÓGICA (cómo se
> valida). La validación NUNCA viaja en el metafield.**

¿Por qué? Porque un regex sí cabe en un JSON, pero validaciones algorítmicas
(p. ej. el dígito verificador de la cédula de Ecuador, módulo 10) son código y
no se pueden serializar. Tener la validación en dos lados (JSON + código) crea
dos fuentes de verdad que se desincronizan. Por eso la tabla completa de
documentos soportados vive en
[`src/doc-validation.js`](extensions/checkout-contact-fields/src/doc-validation.js),
y el metafield solo elige cuáles de esos mostrar y con qué label.

### El metafield

- **Owner:** Tienda (Store / Shop)
- **Namespace + clave:** `checkout_config.settings`
- **Tipo:** JSON
- Lo escribe el **dev** al instalar la app (admin → *Custom data* → *Store*, o
  vía API). No hay UI de configuración porque la app no tiene backend.

Forma del JSON:

```json
{
  "contact_fields": {
    "enabled_doc_types": ["CO3", "PE3", "EC3"],
    "doc_type_labels": {
      "CO3": "Cédula de ciudadanía"
    }
  }
}
```

- **`enabled_doc_types`** — códigos de documento a mostrar, de la tabla
  soportada. Los códigos desconocidos se ignoran. El orden del dropdown lo
  define la tabla del código, no este array.
- **`doc_type_labels`** — override opcional del texto por código. Si un código
  no está acá, usa su label por defecto de los `locales/`.

### Blindaje anti-bloqueo

Si el metafield está **ausente, malformado o con `enabled_doc_types` vacío**, la
extensión muestra **TODOS** los documentos soportados. Esto es deliberado: una
lista vacía dejaría el checkout sin tipos seleccionables y el
`useBuyerJourneyIntercept` **bloquearía la compra**. Ver
[`resolveEnabledDocTypes`](extensions/checkout-contact-fields/src/checkout-config.js).

## Documentos soportados

La tabla completa (14 tipos, 7 países) vive en
[`doc-validation.js`](extensions/checkout-contact-fields/src/doc-validation.js):

| País | Códigos |
|------|---------|
| Colombia | `CO1` (Cédula de extranjería), `CO2` (NIT), `CO3` (Cédula de ciudadanía), `CO4` (Tarjeta de identidad) |
| Perú | `PE3` (DNI) |
| Bolivia | `BL3` (Cédula de identidad) |
| Costa Rica | `CR3` (Cédula de identidad) |
| Ecuador | `EC1` (Pasaporte), `EC2` (RUC), `EC3` (Cédula, con dígito verificador) |
| Guatemala | `GT1` (Pasaporte), `GT2` (NIT), `GT3` (DPI) |
| Panamá | `PN3` (Cédula de identidad) |

Para agregar un documento nuevo: agregá su entrada en `DOC_CONFIG` + su `case`
en `validateDocKey` + las claves en los tres `locales/` + un test. Es un cambio
de código (necesita lógica de validación), no de metafield.

## Estructura de `checkout-contact-fields`

```
src/
  Checkout.jsx          # componente: arma UI, autofill, intercept de validación
  doc-validation.js     # tabla de documentos + validación (fuente de verdad)
  checkout-config.js    # lee el metafield de config (hook + funciones puras)
  customer-metafields.js# hooks de metafields del cliente + wipe por cambio de sesión
  *.test.js             # tests unitarios (vitest)
locales/                # es (default), en, fr
```

La lógica pura (`parseCheckoutConfig`, `resolveEnabledDocTypes`,
`resolveDocLabels` en `checkout-config.js`; todo `doc-validation.js`) está
separada de los hooks de Shopify para poder testearla sin mockear el runtime
del checkout.

## Desarrollo

```bash
npm run dev      # shopify app dev — corre el checkout con las extensiones
npm test         # vitest run — corre los tests unitarios
npm run build    # shopify app build — empaqueta las extensiones
npm run deploy   # shopify app deploy — publica una versión
```

> **Nota de despliegue:** una versión previa configuraba los documentos con
> toggles del *customizer* (`disable_*`). Esos toggles fueron reemplazados por
> el metafield. Al desplegar en una tienda que los usaba, **setea el metafield
> antes o junto con el deploy**: si no, esa tienda pierde su selección y vuelve
> a mostrar todos los documentos (por el blindaje) hasta que exista el metafield.
