import { useMemo } from "preact/hooks";
import {
  useAppMetafields,
  useApplyMetafieldsChange,
} from "@shopify/ui-extensions/checkout/preact";

export const CONFIG_NAMESPACE = "gco_delivery";
export const CONFIG_KEY = "settings";
export const DELIVERY_NAMESPACE = "gco_delivery";

/**
 * Parsea el metafield de tienda `gco_delivery.settings`. Nunca lanza: una
 * config rota no debe tumbar el checkout, solo deja la extensión inactiva.
 *
 * @param {string | undefined | null} rawValue
 * @returns {{ apiKey: string, defaultCenter: {lat:number,lng:number}, defaultZoom: number }}
 */
export function parseAddressMapConfig(rawValue) {
  const fallback = { apiKey: "", defaultCenter: { lat: 0, lng: 0 }, defaultZoom: 16 };
  if (!rawValue) return fallback;
  try {
    const c = JSON.parse(rawValue);
    return {
      apiKey: typeof c?.google_maps_api_key === "string" ? c.google_maps_api_key : "",
      defaultCenter:
        typeof c?.default_center?.lat === "number" &&
        typeof c?.default_center?.lng === "number"
          ? c.default_center
          : fallback.defaultCenter,
      defaultZoom: typeof c?.default_zoom === "number" ? c.default_zoom : fallback.defaultZoom,
    };
  } catch {
    return fallback;
  }
}

/**
 * Lee la config de tienda para el mapa de dirección (API key de Google Maps,
 * centro y zoom por defecto). Memoiza por el valor crudo del metafield.
 *
 * @returns {ReturnType<typeof parseAddressMapConfig>}
 */
export function useAddressMapConfig() {
  const appMetafields = useAppMetafields();
  const rawValue = appMetafields.find(
    (m) =>
      m.metafield.namespace === CONFIG_NAMESPACE && m.metafield.key === CONFIG_KEY,
  )?.metafield?.value;

  return useMemo(() => parseAddressMapConfig(rawValue), [rawValue]);
}

/**
 * Devuelve `save(data)` para persistir la ubicación confirmada en metafields de
 * la orden (namespace `gco_delivery`). Fire-and-forget; cada campo es un string
 * (los metafields de checkout se aplican a la orden al completar el checkout).
 *
 * @returns {(data: { lat: number, lng: number, reference?: string, mapsUrl?: string, confirmed?: boolean }) => void}
 */
export function useApplyDeliveryMetafields() {
  const applyMetafieldChange = useApplyMetafieldsChange();

  return (data) => {
    /** @type {[string, string][]} */
    const entries = [
      ["lat", String(data.lat)],
      ["lng", String(data.lng)],
      ["reference", data.reference ?? ""],
      ["maps_url", data.mapsUrl ?? ""],
      ["confirmed", data.confirmed ? "true" : "false"],
    ];
    for (const [key, value] of entries) {
      applyMetafieldChange({
        type: "updateMetafield",
        namespace: DELIVERY_NAMESPACE,
        key,
        valueType: "string",
        value,
      });
    }
  };
}
