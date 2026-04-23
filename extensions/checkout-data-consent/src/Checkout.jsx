import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import {
  useAttributeValues,
  useApplyAttributeChange,
  useCustomer,
} from "@shopify/ui-extensions/checkout/preact";
import {
  useCustomerMetafield,
  useOnCustomerChange,
} from "./customer-metafields.js";

const OWNER_KEY = "consent_owner";
const OWNED_ATTRIBUTES = ["data_consent", "data_consent_updated_at"];

export default () => {
  render(<Extension />, document.body);
};

function Extension() {
  const applyAttributeChange = useApplyAttributeChange();
  const customer = useCustomer();
  const currentCustomerId = customer?.id;

  const savedConsent = useCustomerMetafield("custom", "data_consent");
  const [checkoutConsent, checkoutConsentUpdatedAt, ownerMarker] = useAttributeValues([
    "data_consent",
    "data_consent_updated_at",
    OWNER_KEY,
  ]);
  const accepted = useSignal(false);
  const hasOwnedValues = Boolean(checkoutConsent || checkoutConsentUpdatedAt);
  const shouldPrefillFromCustomer = Boolean(
    currentCustomerId &&
      savedConsent === "true" &&
      (checkoutConsent === undefined || checkoutConsent === ""),
  );

  /** Estampa el marker del propietario actual junto con cualquier write. */
  const stampOwner = () => {
    if (currentCustomerId) {
      applyAttributeChange({
        type: "updateAttribute",
        key: OWNER_KEY,
        value: currentCustomerId,
      });
    }
  };

  /** Limpia estado local + attributes + marker. */
  const wipeAll = () => {
    accepted.value = false;
    for (const key of OWNED_ATTRIBUTES) {
      applyAttributeChange({ type: "updateAttribute", key, value: "" });
    }
    applyAttributeChange({
      type: "updateAttribute",
      key: OWNER_KEY,
      value: "",
    });
  };

  // Wipe defensivo en mount: marker apunta a otro customer (cierre de
  // navegador, switch de cuenta) → limpiamos antes de evaluar el autofill.
  useEffect(() => {
    if (ownerMarker && ownerMarker !== currentCustomerId) {
      wipeAll();
    }
  }, [ownerMarker, currentCustomerId]);

  // Backfill del owner marker para consent heredado de la implementacion
  // anterior donde existian attributes pero no quedaba estampado OWNER_KEY.
  useEffect(() => {
    if (currentCustomerId && hasOwnedValues && !ownerMarker) {
      stampOwner();
    }
  }, [currentCustomerId, hasOwnedValues, ownerMarker]);

  // Wipe en tiempo real ante logout o cambio de customer dentro de la sesión.
  useOnCustomerChange(() => {
    wipeAll();
  });

  useEffect(() => {
    accepted.value = checkoutConsent === "true" || shouldPrefillFromCustomer;

    if (shouldPrefillFromCustomer) {
      applyAttributeChange({
        type: "updateAttribute",
        key: "data_consent",
        value: "true",
      });

      applyAttributeChange({
        type: "updateAttribute",
        key: "data_consent_updated_at",
        value: new Date().toISOString(),
      });

      stampOwner();
    }
  }, [checkoutConsent, shouldPrefillFromCustomer, applyAttributeChange, currentCustomerId]);

  function onChange(event) {
    const isChecked = event.target.checked;
    accepted.value = isChecked;
    const now = new Date().toISOString();

    applyAttributeChange({
      type: "updateAttribute",
      key: "data_consent",
      value: isChecked ? "true" : "false",
    });

    applyAttributeChange({
      type: "updateAttribute",
      key: "data_consent_updated_at",
      value: now,
    });

    stampOwner();
  }

  return (
    <s-box
      padding="base"
      border-radius="base"
      background="color-bg-surface-secondary"
    >
      <s-stack direction="inline" gap="small-100" block-alignment="center">
        <s-checkbox checked={accepted.value} onChange={onChange} />
        <s-paragraph>
          {shopify.i18n.translate("consentIntro")}{" "}
          <s-link
            href="/pages/terminos-condiciones?category=politica-datos-personales"
            target="_blank"
          >
            {shopify.i18n.translate("policyLinkText")}
          </s-link>
        </s-paragraph>
      </s-stack>
    </s-box>
  );
}
