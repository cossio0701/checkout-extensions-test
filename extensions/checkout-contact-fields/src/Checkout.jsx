import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useState } from "preact/hooks";
import { useBuyerJourneyIntercept } from "@shopify/ui-extensions/checkout/preact";

export default async () => {
  render(<Extension />, document.body);
};

const DOCUMENT_TYPES = [
  { value: "CO-CC",  label: "(Colombia) Cédula de ciudadanía" },
  { value: "PE-DNI", label: "(Perú) DNI" },
  { value: "BO-CI",  label: "(Bolivia) Cédula de identidad" },
  { value: "CR-CI",  label: "(Costa Rica) Cédula de identidad" },
  { value: "EC-CI",  label: "(Ecuador) Cédula ciudadana" },
  { value: "GT-DPI", label: "(Guatemala) DPI" },
  { value: "PA-CI",  label: "(Panamá) Cédula de identidad" },
];

const FORMAT_HINTS = {
  "CO-CC":  "6 a 10 dígitos",
  "PE-DNI": "8 dígitos",
  "BO-CI":  "4 a 8 dígitos, opcional letra al final (ej. 1234567A)",
  "CR-CI":  "9 dígitos",
  "EC-CI":  "10 dígitos",
  "GT-DPI": "13 dígitos",
  "PA-CI":  "Formato: X-XXX-XXXX",
};

/** Valida cédula ecuatoriana usando algoritmo de módulo 10 */
function validateEcuadorCI(value) {
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
 * @param {string} type
 * @param {string} value
 * @returns {string | undefined}
 */
function validateDoc(type, value) {
  if (!value) return "Ingresa tu número de documento";
  switch (type) {
    case "CO-CC":
      return /^\d{6,10}$/.test(value)
        ? undefined : "Solo números, entre 6 y 10 dígitos (sin letras ni símbolos)";
    case "PE-DNI":
      return /^\d{8}$/.test(value)
        ? undefined : "Solo números, exactamente 8 dígitos (sin letras ni símbolos)";
    case "BO-CI":
      return /^\d{4,8}[A-Za-z]?$/.test(value)
        ? undefined : "Entre 4 y 8 dígitos, con una letra opcional al final (ej. 1234567A)";
    case "CR-CI":
      return /^\d{9}$/.test(value)
        ? undefined : "Solo números, exactamente 9 dígitos (sin letras ni símbolos)";
    case "EC-CI":
      return validateEcuadorCI(value)
        ? undefined : "Cédula inválida — deben ser 10 dígitos válidos (sin letras ni símbolos)";
    case "GT-DPI":
      return /^\d{13}$/.test(value)
        ? undefined : "Solo números, exactamente 13 dígitos (sin letras ni símbolos)";
    case "PA-CI":
      return /^\d{1,2}-\d{3,4}-\d{3,4}$/.test(value)
        ? undefined : "Solo números y guiones, formato X-XXX-XXXX";
    default:
      return undefined;
  }
}

function Extension() {
  const [tipoDoc, setTipoDoc] = useState("");
  const [numDoc, setNumDoc] = useState("");
  const [celular, setCelular] = useState("");
  const [errors, setErrors] = useState(
    /** @type {Record<string, string|undefined>} */ ({}),
  );

  useBuyerJourneyIntercept(() => {
    const newErrors = /** @type {Record<string, string>} */ ({});

    if (!tipoDoc) newErrors.tipoDoc = "Selecciona el tipo de documento";

    const docError = validateDoc(tipoDoc, numDoc);
    if (docError) newErrors.numDoc = docError;

    if (!celular) newErrors.celular = "Ingresa tu número de celular";
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(celular))
      newErrors.celular = "Solo números y los caracteres + - ( ), entre 7 y 15 caracteres";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return {
        behavior: "block",
        reason: "Faltan datos de contacto requeridos",
      };
    }

    return { behavior: "allow" };
  });

  async function saveAttribute(key, value) {
    await shopify.applyAttributeChange({ type: "updateAttribute", key, value });
  }

  return (
    <s-stack direction="block" gap="base">
      <s-grid gridTemplateColumns="1fr 1fr" gap="base">
        <s-select
          label="Tipo de documento"
          value={tipoDoc}
          error={errors.tipoDoc}
          onChange={(e) => {
            const v = e.target.value;
            setTipoDoc(v);
            setNumDoc("");
            setErrors((err) =>
              err.tipoDoc === undefined && err.numDoc === undefined
                ? err
                : { ...err, tipoDoc: undefined, numDoc: undefined },
            );
            saveAttribute("tipo_documento", v);
            saveAttribute("numero_documento", "");
          }}
        >
          <s-option value="">Selecciona...</s-option>
          {DOCUMENT_TYPES.map((d) => (
            <s-option key={d.value} value={d.value}>
              {d.label}
            </s-option>
          ))}
        </s-select>

        <s-text-field
          label="Número de documento"
          value={numDoc}
          error={errors.numDoc}
          disabled={!tipoDoc}
          description={tipoDoc ? FORMAT_HINTS[tipoDoc] : undefined}
          onInput={(e) => {
            const v = e.target.value;
            setNumDoc(v);
            setErrors((err) =>
              err.numDoc === undefined ? err : { ...err, numDoc: undefined },
            );
            saveAttribute("numero_documento", v);
          }}
        />
      </s-grid>

      <s-text-field
        label="Número de celular"
        value={celular}
        error={errors.celular}
        onInput={(e) => {
          const v = e.target.value;
          setCelular(v);
          setErrors((err) =>
            err.celular === undefined ? err : { ...err, celular: undefined },
          );
          saveAttribute("celular", v);
        }}
      />
    </s-stack>
  );
}
