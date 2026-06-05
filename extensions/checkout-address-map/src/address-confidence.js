/**
 * Evalúa qué tan confiable es una dirección para entrega. Función pura: nunca
 * lanza y, ante datos desconocidos, NO inventa riesgo (evita falsos positivos
 * que frenarían al usuario sin razón). El metafield lleva datos; el criterio
 * vive aquí.
 */

/** Razones de riesgo (claves estables, usables como llaves de i18n). */
export const REASON = {
  NO_STREET_NUMBER: "noStreetNumber",
  PIN_FAR: "pinFar",
  APPROXIMATE: "approximateLocation",
};

/** Umbral (metros) a partir del cual el pin movido se considera lejos del texto. */
export const PIN_FAR_METERS = 150;

/** Tipos de ubicación de Google considerados imprecisos. */
const APPROXIMATE_TYPES = ["APPROXIMATE", "GEOMETRIC_CENTER"];

/**
 * @param {{ hasStreetNumber?: boolean, pinMovedMeters?: number|null, locationType?: string } | null | undefined} input
 * @returns {{ risky: boolean, reasons: string[] }}
 */
export function assessAddress(input) {
  const reasons = [];
  const { hasStreetNumber, pinMovedMeters, locationType } = input ?? {};

  if (hasStreetNumber === false) reasons.push(REASON.NO_STREET_NUMBER);

  if (typeof pinMovedMeters === "number" && pinMovedMeters > PIN_FAR_METERS) {
    reasons.push(REASON.PIN_FAR);
  }

  if (typeof locationType === "string" && APPROXIMATE_TYPES.includes(locationType)) {
    reasons.push(REASON.APPROXIMATE);
  }

  return { risky: reasons.length > 0, reasons };
}
