import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
  useBuyerJourneyIntercept,
  useAttributeValues,
  useApplyAttributeChange,
  useCustomer,
} from "@shopify/ui-extensions/checkout/preact";
import {
  useCustomerMetafield,
  useOnCustomerChange,
} from "./customer-metafields.js";
import { useCheckoutConfig } from "./checkout-config.js";
import {
  DOC_CONFIG,
  validateDocKey,
  normalizeDocType,
} from "./doc-validation.js";

const OWNER_KEY = "contact_fields_owner";
const OWNED_ATTRIBUTES = ["document_type", "document_number", "phone"];

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const t = (key) => shopify.i18n.translate(key);
  const applyAttributeChange = useApplyAttributeChange();
  const customer = useCustomer();
  const currentCustomerId = customer?.id;

  // Config por tienda desde el metafield `checkout_config.settings`.
  // El metafield solo lleva DATOS (qué documentos mostrar + labels custom);
  // la validación vive siempre en el código (doc-validation.js).
  const { enabledDocTypes, customLabels } = useCheckoutConfig();

  const isDocTypeEnabled = (code) => enabledDocTypes.includes(code);

  const stampOwner = () => {
    if (!currentCustomerId) return;
    applyAttributeChange({
      type: "updateAttribute",
      key: OWNER_KEY,
      value: currentCustomerId,
    });
  };

  /**
   * Sincroniza un attribute del checkout. Fire-and-forget.
   * Si hay customer logueado, también estampa el marker `OWNER_KEY` para
   * detectar datos huérfanos al remontar como otro customer / guest.
   */
  const saveAttribute = (key, value) => {
    applyAttributeChange({
      type: "updateAttribute",
      key,
      value: typeof value === "string" ? value.trim() : value,
    });
    stampOwner();
  };

  const savedDocType = useCustomerMetafield("custom", "document_type");
  const savedDocNumber = useCustomerMetafield("custom", "document_number");
  const savedPhone = useCustomerMetafield("custom", "phone");

  // Valores actuales en el checkout + marker de propietario.
  const [initialDocType, initialDocNumber, initialPhone, ownerMarker] =
    useAttributeValues([
      "document_type",
      "document_number",
      "phone",
      OWNER_KEY,
    ]);
  const hasOwnedValues = Boolean(
    initialDocType || initialDocNumber || initialPhone,
  );

  const [docType, setDocType] = useState(normalizeDocType(initialDocType));
  const [docNumber, setDocNumber] = useState(initialDocNumber ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [didAutofill, setDidAutofill] = useState(false);
  const [errors, setErrors] = useState(
    /** @type {Record<string, string|undefined>} */ ({}),
  );

  const selectedDocConfig = DOC_CONFIG[docType] ?? undefined;

  /** Limpia estado local + attributes + marker. */
  const wipeAll = () => {
    setDocType("");
    setDocNumber("");
    setPhone("");
    setErrors({});
    setDidAutofill(false);
    for (const key of OWNED_ATTRIBUTES) {
      applyAttributeChange({ type: "updateAttribute", key, value: "" });
    }
    applyAttributeChange({
      type: "updateAttribute",
      key: OWNER_KEY,
      value: "",
    });
  };

  // Wipe defensivo en mount: si el marker apunta a un customer distinto
  // (cierre de navegador, switch de cuenta) limpiamos antes que cualquier
  // otro efecto pueda reusar datos huérfanos.
  useEffect(() => {
    if (ownerMarker && ownerMarker !== currentCustomerId) {
      wipeAll();
    }
  }, [ownerMarker, currentCustomerId]);

  // Limpia el tipo de documento si fue deshabilitado desde el customizer.
  useEffect(() => {
    if (docType && !isDocTypeEnabled(docType)) {
      setDocType("");
      setDocNumber("");
      saveAttribute("document_type", "");
      saveAttribute("document_number", "");
    }
  }, [enabledDocTypes.join(",")]);

  // Backfill del owner marker para valores heredados de implementaciones
  // anteriores donde los attributes existian pero aun no se estampaba OWNER_KEY.
  useEffect(() => {
    if (currentCustomerId && hasOwnedValues && !ownerMarker) {
      stampOwner();
    }
  }, [currentCustomerId, hasOwnedValues, ownerMarker]);

  // Wipe en tiempo real ante logout o cambio de customer dentro de la sesión.
  useOnCustomerChange(() => {
    wipeAll();
  });

  // Autofill único desde customer metafields cuando el cliente está logueado.
  // Corre una sola vez: no pisa ediciones del usuario aunque deje un campo vacío.
  // Tipos desconocidos o deshabilitados se ignoran; phone se autofill independientemente.
  useEffect(() => {
    if (didAutofill) return;
    const hasAnySaved = savedDocType || savedDocNumber || savedPhone;
    if (!hasAnySaved) return;

    const isDocTypeSavedEnabled = isDocTypeEnabled(savedDocType);

    if (isDocTypeSavedEnabled && savedDocType && !initialDocType) {
      setDocType(savedDocType);
      saveAttribute("document_type", savedDocType);
    }

    if (isDocTypeSavedEnabled && savedDocNumber && !initialDocNumber) {
      setDocNumber(savedDocNumber);
      saveAttribute("document_number", savedDocNumber);
    }

    if (savedPhone && !initialPhone) {
      setPhone(savedPhone);
      saveAttribute("phone", savedPhone);
    }

    setErrors({});
    setDidAutofill(true);
  }, [
    savedDocType,
    savedDocNumber,
    savedPhone,
    initialDocType,
    initialDocNumber,
    initialPhone,
    didAutofill,
    enabledDocTypes.join(","),
  ]);

  useBuyerJourneyIntercept(() => {
    const newErrors = /** @type {Record<string, string>} */ ({});

    const trimmedDoc = docNumber.trim();
    const trimmedPhone = phone.trim();

    if (!docType) newErrors.docType = t("errorDocTypeRequired");

    const docErrorKey = validateDocKey(docType, trimmedDoc);
    if (docErrorKey) newErrors.docNumber = t(docErrorKey);

    if (!trimmedPhone) newErrors.phone = t("errorPhoneRequired");
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(trimmedPhone))
      newErrors.phone = t("errorPhoneInvalid");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return {
        behavior: "block",
        reason: t("interceptReason"),
      };
    }

    return { behavior: "allow" };
  });

  return (
    <s-stack direction="block" gap="base">
      <s-grid gridTemplateColumns="1fr 1fr" gap="base">
        <s-select
          label={t("labelDocumentType")}
          value={docType}
          error={errors.docType}
          onChange={(e) => {
            const v = e.target.value;
            setDocType(v);
            setDocNumber("");
            setErrors((err) =>
              err.docType === undefined && err.docNumber === undefined
                ? err
                : { ...err, docType: undefined, docNumber: undefined },
            );
            saveAttribute("document_type", v);
            saveAttribute("document_number", "");
          }}
        >
          <s-option value="">{t("selectPlaceholder")}</s-option>
          {enabledDocTypes.map((code) => (
            <s-option key={code} value={code}>
              {customLabels[code] || t(DOC_CONFIG[code].label)}
            </s-option>
          ))}
        </s-select>

        <s-text-field
          label={t("labelDocumentNumber")}
          value={docNumber}
          error={errors.docNumber}
          disabled={!selectedDocConfig}
          maxLength={selectedDocConfig?.maxLength}
          // @ts-expect-error — `description` is supported at runtime by s-text-field
          description={selectedDocConfig ? t(selectedDocConfig.hint) : undefined}
          onInput={(e) => {
            const v = e.target.value;
            setDocNumber(v);
            setErrors((err) =>
              err.docNumber === undefined ? err : { ...err, docNumber: undefined },
            );
            saveAttribute("document_number", v);
          }}
        />
      </s-grid>

      <s-text-field
        label={t("labelPhone")}
        value={phone}
        error={errors.phone}
        maxLength={15}
        onInput={(e) => {
          const v = e.target.value;
          setPhone(v);
          setErrors((err) =>
            err.phone === undefined ? err : { ...err, phone: undefined },
          );
          saveAttribute("phone", v);
        }}
      />
    </s-stack>
  );
}
