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
import {
  DOC_TYPES,
  DOC_CONFIG,
  validateDocKey,
  isSupportedDocType,
  normalizeDocType,
} from "./doc-validation.js";

const OWNER_KEY = "contact_fields_owner";
const OWNED_ATTRIBUTES = ["tipo_documento", "numero_documento", "celular"];

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const t = (key) => shopify.i18n.translate(key);
  const applyAttributeChange = useApplyAttributeChange();
  const customer = useCustomer();
  const currentCustomerId = customer?.id;

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

  const savedTipoDoc = useCustomerMetafield("custom", "tipo_documento");
  const savedNumDoc = useCustomerMetafield("custom", "numero_documento");
  const savedCelular = useCustomerMetafield("custom", "celular");

  // Valores actuales en el checkout + marker de propietario.
  const [initialDocType, initialDocNumber, initialPhone, ownerMarker] =
    useAttributeValues([
      "tipo_documento",
      "numero_documento",
      "celular",
      OWNER_KEY,
    ]);
  const hasOwnedValues = Boolean(
    initialDocType || initialDocNumber || initialPhone,
  );

  const [tipoDoc, setTipoDoc] = useState(normalizeDocType(initialDocType));
  const [numDoc, setNumDoc] = useState(initialDocNumber ?? "");
  const [celular, setCelular] = useState(initialPhone ?? "");
  const [didAutofill, setDidAutofill] = useState(false);
  const [errors, setErrors] = useState(
    /** @type {Record<string, string|undefined>} */ ({}),
  );

  const selectedDocConfig = DOC_CONFIG[tipoDoc] ?? undefined;

  /** Limpia estado local + attributes + marker. */
  const wipeAll = () => {
    setTipoDoc("");
    setNumDoc("");
    setCelular("");
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
  // Tipos desconocidos se ignoran; celular se autofill independientemente.
  useEffect(() => {
    if (didAutofill) return;
    const hasAnySaved = savedTipoDoc || savedNumDoc || savedCelular;
    if (!hasAnySaved) return;

    const isTipoDocSupported = isSupportedDocType(savedTipoDoc);

    if (isTipoDocSupported && savedTipoDoc && !initialDocType) {
      setTipoDoc(savedTipoDoc);
      saveAttribute("tipo_documento", savedTipoDoc);
    }

    if (isTipoDocSupported && savedNumDoc && !initialDocNumber) {
      setNumDoc(savedNumDoc);
      saveAttribute("numero_documento", savedNumDoc);
    }

    if (savedCelular && !initialPhone) {
      setCelular(savedCelular);
      saveAttribute("celular", savedCelular);
    }

    setErrors({});
    setDidAutofill(true);
  }, [
    savedTipoDoc,
    savedNumDoc,
    savedCelular,
    initialDocType,
    initialDocNumber,
    initialPhone,
    didAutofill,
  ]);

  useBuyerJourneyIntercept(() => {
    const newErrors = /** @type {Record<string, string>} */ ({});

    const trimmedDoc = numDoc.trim();
    const trimmedPhone = celular.trim();

    if (!tipoDoc) newErrors.tipoDoc = t("errorDocTypeRequired");

    const docErrorKey = validateDocKey(tipoDoc, trimmedDoc);
    if (docErrorKey) newErrors.numDoc = t(docErrorKey);

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
          disabled={!selectedDocConfig}
          maxLength={selectedDocConfig?.maxLength}
          // @ts-expect-error — `description` is supported at runtime by s-text-field
          description={selectedDocConfig ? t(selectedDocConfig.hint) : undefined}
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
