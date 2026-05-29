export const DOC_TYPES = ["CO1", "CO2", "CO3", "CO4", "PE3", "BL3", "CR3", "EC1", "EC2", "EC3", "GT1", "GT2", "GT3", "PN3"];

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
  "CO1": { label: "docTypeCo1", hint: "hintCo1", error: "errorCo1", maxLength: 16 },
  "CO2": { label: "docTypeCo2", hint: "hintCo2", error: "errorCo2", maxLength: 11 },
  "CO3": { label: "docTypeCo3", hint: "hintCo3", error: "errorCo3", maxLength: 10 },
  "CO4": { label: "docTypeCo4", hint: "hintCo4", error: "errorCo4", maxLength: 10 },
  "PE3": { label: "docTypePe3", hint: "hintPe3", error: "errorPe3", maxLength: 8  },
  "BL3": { label: "docTypeBl3", hint: "hintBl3", error: "errorBl3", maxLength: 9  },
  "CR3": { label: "docTypeCr3", hint: "hintCr3", error: "errorCr3", maxLength: 9  },
  "EC1": { label: "docTypeEc1", hint: "hintEc1", error: "errorEc1", maxLength: 15 },
  "EC2": { label: "docTypeEc2", hint: "hintEc2", error: "errorEc2", maxLength: 13 },
  "EC3": { label: "docTypeEc3", hint: "hintEc3", error: "errorEc3", maxLength: 10 },
  "GT1": { label: "docTypeGt1", hint: "hintGt1", error: "errorGt1", maxLength: 15 },
  "GT2": { label: "docTypeGt2", hint: "hintGt2", error: "errorGt2", maxLength: 12 },
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
    case "CO1":
      return /^[A-Za-z0-9]{4,16}$/.test(value) ? undefined : "errorCo1";
    case "CO2":
      return /^\d{9}-\d$/.test(value) ? undefined : "errorCo2";
    case "CO3":
      return /^\d{6,10}$/.test(value) ? undefined : "errorCo3";
    case "CO4":
      return /^\d{10}$/.test(value) ? undefined : "errorCo4";
    case "PE3":
      return /^\d{8}$/.test(value) ? undefined : "errorPe3";
    case "BL3":
      return /^\d{4,8}[A-Za-z]?$/.test(value) ? undefined : "errorBl3";
    case "CR3":
      return /^\d{9}$/.test(value) ? undefined : "errorCr3";
    case "EC1":
      return /^[A-Za-z0-9]{5,15}$/.test(value) ? undefined : "errorEc1";
    case "EC2":
      return /^\d{13}$/.test(value) ? undefined : "errorEc2";
    case "EC3":
      return validateEcuadorCI(value) ? undefined : "errorEc3";
    case "GT1":
      return /^[A-Za-z0-9]{5,15}$/.test(value) ? undefined : "errorGt1";
    case "GT2":
      return /^\d+-\d+$/.test(value) ? undefined : "errorGt2";
    case "GT3":
      return /^\d{13}$/.test(value) ? undefined : "errorGt3";
    case "PN3":
      return /^\d{1,2}-\d{3,4}-\d{3,4}$/.test(value) ? undefined : "errorPn3";
    default:
      return undefined;
  }
}
