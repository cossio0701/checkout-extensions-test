import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useSignal } from "@preact/signals";
import { useBuyerJourneyIntercept } from "@shopify/ui-extensions/checkout/preact";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const accepted = useSignal(false);
  const showError = useSignal(false);

  useBuyerJourneyIntercept(() => {
    if (!accepted.value) {
      showError.value = true;
      return {
        behavior: "block",
        reason: "Data processing consent not accepted",
        errors: [
          {
            message: shopify.i18n.translate("consentRequired"),
          },
        ],
      };
    }
    showError.value = false;
    return { behavior: "allow" };
  });

  async function onChange(event) {
    const isChecked = event.target.checked;
    accepted.value = isChecked;
    if (isChecked) showError.value = false;

    await shopify.applyAttributeChange({
      type: "updateAttribute",
      key: "data_consent",
      value: isChecked ? "true" : "false",
    });
    await shopify.applyAttributeChange({
      type: "updateAttribute",
      key: "data_consent_at",
      value: isChecked ? new Date().toISOString() : "",
    });
  }

  return (
    <s-banner tone={showError.value ? "critical" : "info"}>
      <s-checkbox
        checked={accepted.value}
        error={showError.value ? shopify.i18n.translate("consentRequired") : undefined}
        onChange={onChange}
        label={shopify.i18n.translate("consentLabel")}
      />
    </s-banner>
  );
}
