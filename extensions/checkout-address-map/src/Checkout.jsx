import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useShippingAddress } from "@shopify/ui-extensions/checkout/preact";
import { geocodeAddress, coordsToMapsUrl, haversineMeters } from "./geocoding.js";
import { assessAddress, REASON } from "./address-confidence.js";
import { cleanText } from "./address-format.js";
import {
  useAddressMapConfig,
  useApplyDeliveryMetafields,
} from "./delivery-metafields.js";

const DEBOUNCE_MS = 800;

// A partir de cuántos metros movidos ofrecemos al cliente volver el pin a su
// dirección. Por debajo es un reajuste fino y no vale la pena ofrecer el reset.
const PIN_MOVED_NOTICE_M = 25;

export default async () => {
  render(<Extension />, document.body);
};

/**
 * Arma el query de geocodificación a partir de la dirección de envío.
 * @param {any} addr
 * @returns {string}
 */
function buildQuery(addr) {
  if (!addr) return "";
  return [
    addr.address1,
    addr.address2,
    addr.city,
    addr.provinceCode || addr.province,
    addr.zip,
    addr.countryCode,
  ]
    .map((p) => cleanText(p))
    .filter(Boolean)
    .join(", ");
}

/** Mapea las razones de riesgo al mensaje i18n a mostrar. */
function riskMessageKey(reasons) {
  if (reasons.includes(REASON.NO_STREET_NUMBER)) return "riskNoNumber";
  if (reasons.includes(REASON.APPROXIMATE)) return "riskApproximate";
  if (reasons.includes(REASON.PIN_FAR)) return "riskPinFar";
  return "riskGeneric";
}

function Extension() {
  // Defensivo: si la interpolación lanza por cualquier motivo, caemos a la
  // traducción simple en vez de tumbar el render completo de la extensión.
  const t = (key, options) => {
    try {
      return shopify.i18n.translate(key, options);
    } catch {
      return shopify.i18n.translate(key);
    }
  };
  const address = useShippingAddress();
  const { apiKey, defaultZoom } = useAddressMapConfig();
  const saveDelivery = useApplyDeliveryMetafields();

  const query = buildQuery(address);

  const [geo, setGeo] = useState(
    /** @type {null | {lat:number,lng:number,formatted:string,hasStreetNumber:boolean,locationType:string}} */ (
      null
    ),
  );
  const [pin, setPin] = useState(/** @type {null | {lat:number,lng:number}} */ (null));
  const [reference, setReference] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // Geocodifica (debounced) cuando cambia la dirección. Sin API key o sin
  // dirección, la extensión queda inactiva sin romper el checkout.
  useEffect(() => {
    if (!apiKey || !query) {
      setGeo(null);
      setPin(null);
      return;
    }
    let cancelled = false;
    const id = setTimeout(async () => {
      const result = await geocodeAddress(query, apiKey);
      if (cancelled || !result) return;
      setGeo(result);
      setPin({ lat: result.lat, lng: result.lng });
      setConfirmed(false);
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query, apiKey]);

  // Persiste la ubicación capturada en metafields de la orden. El texto es para
  // leer; las coordenadas, para navegar. Guardamos ambos + referencia.
  useEffect(() => {
    if (!pin) return;
    saveDelivery({
      lat: pin.lat,
      lng: pin.lng,
      reference: cleanText(reference),
      mapsUrl: coordsToMapsUrl(pin.lat, pin.lng),
      confirmed,
    });
  }, [pin?.lat, pin?.lng, reference, confirmed]);

  if (!apiKey || !geo || !pin) return null;

  const pinMovedMeters = haversineMeters(geo, pin);
  const { risky, reasons } = assessAddress({
    hasStreetNumber: geo.hasStreetNumber,
    pinMovedMeters,
    locationType: geo.locationType,
  });

  // Click sobre el mapa → recolocar el pin en las coordenadas exactas.
  const handleMapClick = (e) => {
    const loc = e?.location;
    if (
      !loc ||
      typeof loc.latitude !== "number" ||
      typeof loc.longitude !== "number"
    ) {
      return;
    }
    setPin({ lat: loc.latitude, lng: loc.longitude });
    setConfirmed(false);
  };

  // Devuelve el pin a la posición geocodificada de la dirección. Para cuando el
  // cliente lo movió por error y quiere volver al punto original.
  const resetPinToAddress = () => {
    setPin({ lat: geo.lat, lng: geo.lng });
    setConfirmed(false);
  };

  return (
    <s-stack direction="block" gap="base">
      <s-text>{t("mapInstructions")}</s-text>

      <s-map
        apiKey={apiKey}
        latitude={pin.lat}
        longitude={pin.lng}
        zoom={defaultZoom}
        blockSize="260px"
        accessibilityLabel={t("mapLabel")}
        onClick={handleMapClick}
      >
        <s-map-marker latitude={pin.lat} longitude={pin.lng} />
      </s-map>

      {typeof pinMovedMeters === "number" &&
        pinMovedMeters >= PIN_MOVED_NOTICE_M && (
          <s-link onClick={resetPinToAddress}>{t("resetPin")}</s-link>
        )}

      <s-text-field
        label={t("labelReference")}
        value={reference}
        maxLength={120}
        // @ts-expect-error — `description` is supported at runtime by s-text-field
        description={t("hintReference")}
        onInput={(e) => setReference(e.target.value)}
      />

      {risky && (
        <s-checkbox
          checked={confirmed}
          label={t(riskMessageKey(reasons))}
          onChange={(e) => setConfirmed(Boolean(e.target.checked))}
        />
      )}
    </s-stack>
  );
}
