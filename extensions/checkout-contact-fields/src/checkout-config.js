import { useMemo } from "preact/hooks";
import { useAppMetafields } from "@shopify/ui-extensions/checkout/preact";
import { DOC_TYPES } from "./doc-validation.js";

export const CONFIG_NAMESPACE = "checkout_config";
export const CONFIG_KEY = "settings";

/**
 * Parsea el valor crudo del metafield de configuración. Devuelve el objeto
 * parseado, o `null` si está ausente o malformado. Nunca lanza: una config
 * rota no debe tumbar el checkout.
 *
 * @param {string | undefined | null} rawValue
 * @returns {any | null}
 */
export function parseCheckoutConfig(rawValue) {
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

/**
 * Resuelve qué tipos de documento mostrar a partir de la config.
 *
 * Blindaje anti-bloqueo: si la lista está ausente, malformada o vacía,
 * devuelve TODOS los tipos soportados. Una lista vacía dejaría el checkout sin
 * opciones seleccionables y el `useBuyerJourneyIntercept` bloquearía la compra.
 *
 * Filtra códigos desconocidos y preserva el orden de `allDocTypes`.
 *
 * @param {any | null} config
 * @param {string[]} [allDocTypes]
 * @returns {string[]}
 */
export function resolveEnabledDocTypes(config, allDocTypes = DOC_TYPES) {
  const configured = config?.contact_fields?.enabled_doc_types;
  if (!Array.isArray(configured) || configured.length === 0) {
    return allDocTypes;
  }
  return allDocTypes.filter((code) => configured.includes(code));
}

/**
 * Devuelve el mapa de labels custom por código de documento, o `{}` si no hay
 * uno válido. El metafield solo lleva DATOS de presentación: la validación de
 * cada documento vive siempre en `doc-validation.js`.
 *
 * @param {any | null} config
 * @returns {Record<string, string>}
 */
export function resolveDocLabels(config) {
  const labels = config?.contact_fields?.doc_type_labels;
  return labels && typeof labels === "object" ? labels : {};
}

/**
 * Lee el metafield de tienda `checkout_config.settings` y devuelve la config
 * resuelta para los campos de contacto. Memoiza por el valor crudo del
 * metafield para no re-parsear el JSON en cada render del checkout.
 *
 * @returns {{ enabledDocTypes: string[], customLabels: Record<string, string> }}
 */
export function useCheckoutConfig() {
  const appMetafields = useAppMetafields();
  const rawValue = appMetafields.find(
    (m) =>
      m.metafield.namespace === CONFIG_NAMESPACE &&
      m.metafield.key === CONFIG_KEY,
  )?.metafield?.value;

  return useMemo(() => {
    const config = parseCheckoutConfig(rawValue);
    return {
      enabledDocTypes: resolveEnabledDocTypes(config),
      customLabels: resolveDocLabels(config),
    };
  }, [rawValue]);
}
