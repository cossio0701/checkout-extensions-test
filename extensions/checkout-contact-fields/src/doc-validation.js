export const DOC_TYPES = ["CO3", "PE3", "BL3", "CR3", "EC3", "GT3", "PN3"];

/**
 * Devuelve true si el código está entre los tipos soportados.
 * @param {string} code
 * @returns {boolean}
 */
export function isSupportedDocType(code) {
  return DOC_TYPES.includes(code);
}

/**
 * Normaliza un tipo de documento: devuelve el código si está soportado,
 * o "" si no. Útil para autofill desde metafields/attributes.
 * @param {string | undefined} code
 * @returns {string}
 */
export function normalizeDocType(code) {
  return isSupportedDocType(code) ? code : "";
}

/** @type {Record<string, { label: string, hint: string, error: string, maxLength: number }>} */
export const DOC_CONFIG = {
  "CO3": { label: "docTypeCo3", hint: "hintCo3", error: "errorCo3", maxLength: 10 },
  "PE3": { label: "docTypePe3", hint: "hintPe3", error: "errorPe3", maxLength: 8  },
  "BL3": { label: "docTypeBl3", hint: "hintBl3", error: "errorBl3", maxLength: 9  },
  "CR3": { label: "docTypeCr3", hint: "hintCr3", error: "errorCr3", maxLength: 9  },
  "EC3": { label: "docTypeEc3", hint: "hintEc3", error: "errorEc3", maxLength: 10 },
  "GT3": { label: "docTypeGt3", hint: "hintGt3", error: "errorGt3", maxLength: 13 },
  "PN3": { label: "docTypePn3", hint: "hintPn3", error: "errorPn3", maxLength: 12 },
};

/** Valida cédula ecuatoriana usando algoritmo de módulo 10. */
export function validateEcuadorCI(value) {
  if (!/^\d{10}$/.test(value)) return false;
  const province = parseInt(value.substring(0, 2));
  if (province < 1 || province > 24) return false;
  if (parseInt(value[2]) > 6) return false;
  const coeff = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let v = parseInt(value[i]) * coeff[i];
    if (v >= 10) v -= 9;
    sum += v;
  }
  const check = sum % 10 === 0 ? 0 : 10 - (sum % 10);
  return check === parseInt(value[9]);
}

/**
 * Devuelve el key i18n del error, o `undefined` si el documento es válido.
 * Separar del `translate` permite testear la lógica sin mockear i18n.
 *
 * @param {string} type
 * @param {string} value
 * @returns {string | undefined}
 */
export function validateDocKey(type, value) {
  if (!value) return "errorDocRequired";
  switch (type) {
    case "CO3":
      return /^\d{6,10}$/.test(value) ? undefined : "errorCo3";
    case "PE3":
      return /^\d{8}$/.test(value) ? undefined : "errorPe3";
    case "BL3":
      return /^\d{4,8}[A-Za-z]?$/.test(value) ? undefined : "errorBl3";
    case "CR3":
      return /^\d{9}$/.test(value) ? undefined : "errorCr3";
    case "EC3":
      return validateEcuadorCI(value) ? undefined : "errorEc3";
    case "GT3":
      return /^\d{13}$/.test(value) ? undefined : "errorGt3";
    case "PN3":
      return /^\d{1,2}-\d{3,4}-\d{3,4}$/.test(value) ? undefined : "errorPn3";
    default:
      return undefined;
  }
}
