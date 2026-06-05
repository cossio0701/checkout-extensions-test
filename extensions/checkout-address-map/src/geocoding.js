/**
 * Lógica de geocodificación. Las funciones puras (`parseGeocodeResponse`,
 * `coordsToMapsUrl`, `haversineMeters`) nunca lanzan: una respuesta rota de
 * Google no debe tumbar el checkout. `geocodeAddress` es el wrapper fino de red.
 */

const EARTH_RADIUS_M = 6371000;

/** @param {unknown} n */
function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

/** @param {unknown} lat @param {unknown} lng */
function isValidCoord(lat, lng) {
  return (
    isFiniteNumber(lat) &&
    isFiniteNumber(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Parsea una respuesta de Google Geocoding API. Devuelve los datos del primer
 * resultado, o `null` si la respuesta está ausente, sin resultados o malformada.
 *
 * @param {any} json
 * @returns {{ lat: number, lng: number, formatted: string, hasStreetNumber: boolean, locationType: string } | null}
 */
export function parseGeocodeResponse(json) {
  const result = json?.results?.[0];
  const location = result?.geometry?.location;
  if (!result || !location) return null;
  if (!isValidCoord(location.lat, location.lng)) return null;

  const components = Array.isArray(result.address_components)
    ? result.address_components
    : [];
  const hasStreetNumber = components.some((c) =>
    Array.isArray(c?.types) ? c.types.includes("street_number") : false,
  );

  return {
    lat: location.lat,
    lng: location.lng,
    formatted: typeof result.formatted_address === "string" ? result.formatted_address : "",
    hasStreetNumber,
    locationType:
      typeof result.geometry?.location_type === "string"
        ? result.geometry.location_type
        : "",
  };
}

/**
 * Construye un link de Google Maps a unas coordenadas, o `""` si son inválidas.
 *
 * @param {unknown} lat @param {unknown} lng
 * @returns {string}
 */
export function coordsToMapsUrl(lat, lng) {
  if (!isValidCoord(lat, lng)) return "";
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/**
 * Distancia en metros entre dos puntos `{lat,lng}` (fórmula de Haversine).
 * Devuelve `null` si alguno de los puntos es inválido.
 *
 * @param {{lat:unknown,lng:unknown}|null|undefined} a
 * @param {{lat:unknown,lng:unknown}|null|undefined} b
 * @returns {number | null}
 */
export function haversineMeters(a, b) {
  if (!a || !b || !isValidCoord(a.lat, a.lng) || !isValidCoord(b.lat, b.lng)) {
    return null;
  }
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Wrapper fino sobre la Geocoding API de Google. Devuelve los datos parseados o
 * `null`. No lanza: cualquier fallo de red se traga y devuelve `null`.
 *
 * @param {string} query Dirección a geocodificar.
 * @param {string} apiKey API key de Google Maps.
 * @returns {Promise<ReturnType<typeof parseGeocodeResponse>>}
 */
export async function geocodeAddress(query, apiKey) {
  if (!query || !apiKey) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      query,
    )}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return parseGeocodeResponse(await res.json());
  } catch {
    return null;
  }
}
