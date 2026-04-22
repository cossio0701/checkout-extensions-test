import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useState } from "preact/hooks";
import {
  useBuyerJourneyIntercept,
  useAttributeValues,
} from "@shopify/ui-extensions/checkout/preact";

export default async () => {
  render(<Extension />, document.body);
};

const DOC_TYPES = ["CO3", "PE3", "BL3", "CR3", "EC3", "GT3", "PN3"];

/** @type {Record<string, { label: string, hint: string, error: string, maxLength: number }>} */
const DOC_CONFIG = {
  "CO3": { label: "docTypeCo3", hint: "hintCo3", error: "errorCo3", maxLength: 10 },
  "PE3": { label: "docTypePe3", hint: "hintPe3", error: "errorPe3", maxLength: 8  },
  "BL3": { label: "docTypeBl3", hint: "hintBl3", error: "errorBl3", maxLength: 9  },
  "CR3": { label: "docTypeCr3", hint: "hintCr3", error: "errorCr3", maxLength: 9  },
  "EC3": { label: "docTypeEc3", hint: "hintEc3", error: "errorEc3", maxLength: 10 },
  "GT3": { label: "docTypeGt3", hint: "hintGt3", error: "errorGt3", maxLength: 13 },
  "PN3": { label: "docTypePn3", hint: "hintPn3", error: "errorPn3", maxLength: 12 },
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
 * @param {(key: string) => string} t
 * @returns {string | undefined}
 */
function validateDoc(type, value, t) {
  if (!value) return t("errorDocRequired");
  switch (type) {
    case "CO3":
      return /^\d{6,10}$/.test(value) ? undefined : t("errorCo3");
    case "PE3":
      return /^\d{8}$/.test(value) ? undefined : t("errorPe3");
    case "BL3":
      return /^\d{4,8}[A-Za-z]?$/.test(value) ? undefined : t("errorBl3");
    case "CR3":
      return /^\d{9}$/.test(value) ? undefined : t("errorCr3");
    case "EC3":
      return validateEcuadorCI(value) ? undefined : t("errorEc3");
    case "GT3":
      return /^\d{13}$/.test(value) ? undefined : t("errorGt3");
    case "PN3":
      return /^\d{1,2}-\d{3,4}-\d{3,4}$/.test(value) ? undefined : t("errorPn3");
    default:
      return undefined;
  }
}

function Extension() {
  const t = (key) => shopify.i18n.translate(key);

  const [initialDocType, initialDocNumber, initialPhone] = useAttributeValues([
    "tipo_documento",
    "numero_documento",
    "celular",
  ]);

  const [tipoDoc, setTipoDoc] = useState(initialDocType ?? "");
  const [numDoc, setNumDoc] = useState(initialDocNumber ?? "");
  const [celular, setCelular] = useState(initialPhone ?? "");
  const [errors, setErrors] = useState(
    /** @type {Record<string, string|undefined>} */ ({}),
  );

  useBuyerJourneyIntercept(() => {
    const newErrors = /** @type {Record<string, string>} */ ({});

    const trimmedDoc = numDoc.trim();
    const trimmedPhone = celular.trim();

    if (!tipoDoc) newErrors.tipoDoc = t("errorDocTypeRequired");

    const docError = validateDoc(tipoDoc, trimmedDoc, t);
    if (docError) newErrors.numDoc = docError;

    if (!trimmedPhone) newErrors.celular = t("errorPhoneRequired");
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(trimmedPhone))
      newErrors.celular = t("errorPhoneInvalid");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return {
        behavior: "block",
        reason: t("interceptReason"),
      };
    }

    return { behavior: "allow" };
  });

  async function saveAttribute(key, value) {
    await shopify.applyAttributeChange({
      type: "updateAttribute",
      key,
      value: typeof value === "string" ? value.trim() : value,
    });
  }

  return (
    <s-stack direction="block" gap="base">
      <s-grid gridTemplateColumns="1fr 1fr" gap="base">
        <s-select
          label={t("labelDocumentType")}
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
          <s-option value="">{t("selectPlaceholder")}</s-option>
          {DOC_TYPES.map((code) => (
            <s-option key={code} value={code}>
              {t(DOC_CONFIG[code].label)}
            </s-option>
          ))}
        </s-select>

        <s-text-field
          label={t("labelDocumentNumber")}
          value={numDoc}
          error={errors.numDoc}
          disabled={!tipoDoc}
          maxLength={tipoDoc ? DOC_CONFIG[tipoDoc].maxLength : undefined}
          // @ts-expect-error — `description` is supported at runtime by s-text-field
          description={tipoDoc ? t(DOC_CONFIG[tipoDoc].hint) : undefined}
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
        label={t("labelPhone")}
        value={celular}
        error={errors.celular}
        maxLength={15}
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
