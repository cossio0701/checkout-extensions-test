import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { useAttributeValues } from "@shopify/ui-extensions/checkout/preact";

export default () => {
  render(<Extension />, document.body);
};

function Extension() {
  const [savedConsent] = useAttributeValues(["data_consent"]);
  const accepted = useSignal(savedConsent === "true");

  // Persistir estado inicial una vez al montar
  useEffect(() => {
    const now = new Date().toISOString();

    shopify.applyAttributeChange({
      type: "updateAttribute",
      key: "data_consent",
      value: accepted.value ? "true" : "false",
    });

    shopify.applyAttributeChange({
      type: "updateAttribute",
      key: "data_consent_updated_at",
      value: now,
    });
  }, []);

  function onChange(event) {
    const isChecked = event.target.checked;
    accepted.value = isChecked;
    const now = new Date().toISOString();

    shopify.applyAttributeChange({
      type: "updateAttribute",
      key: "data_consent",
      value: isChecked ? "true" : "false",
    });

    shopify.applyAttributeChange({
      type: "updateAttribute",
      key: "data_consent_updated_at",
      value: now,
    });
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
