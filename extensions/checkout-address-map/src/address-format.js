/**
 * Helpers de formato de texto de dirección. Puros, nunca lanzan.
 * `composeTextWithLink` arma el fallback texto-only (dirección + referencia +
 * link de mapa) para cuando el WMS solo lee un campo de texto.
 */

/**
 * Recorta y colapsa espacios. Devuelve `""` ante valores no-string.
 * @param {unknown} value
 * @returns {string}
 */
export function cleanText(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Combina dirección + referencia + link de mapa en una sola línea legible.
 * Omite las partes vacías. La dirección es para leer; el link, para navegar.
 *
 * @param {string} address
 * @param {string} reference
 * @param {string} mapsUrl
 * @returns {string}
 */
export function composeTextWithLink(address, reference, mapsUrl) {
  const addr = cleanText(address);
  const ref = cleanText(reference);
  const url = cleanText(mapsUrl);

  let out = addr;
  if (ref) out = out ? `${out} — ${ref}` : ref;
  if (url) out = out ? `${out} 📍 ${url}` : url;
  return out;
}
