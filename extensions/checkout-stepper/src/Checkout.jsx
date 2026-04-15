import '@shopify/ui-extensions/preact';
import { render } from "preact";
import { useBuyerJourneyActiveStep } from '@shopify/ui-extensions/checkout/preact';

export default async () => {
  render(<Extension />, document.body);
};

const STEPS = [
  { handle: "information", label: "Contacto" },
  { handle: "shipping",    label: "Entrega"  },
  { handle: "payment",     label: "Pago"     },
];

function Extension() {
  const activeStep = useBuyerJourneyActiveStep();
  const activeIndex = STEPS.findIndex((s) => s.handle === activeStep?.handle);

  return (
    <s-stack direction="inline" gap="base">
      {STEPS.map((step, index) => {
        const isCompleted = activeIndex !== -1 && index < activeIndex;
        const isActive    = index === activeIndex;

        return (
          <s-stack direction="inline" gap="small" key={step.handle}>
            <s-text
              type={isActive ? "emphasis" : "generic"}
              tone={isCompleted ? "success" : isActive ? "auto" : "neutral"}
            >
              {isCompleted ? `✓ ${step.label}` : `${index + 1}. ${step.label}`}
            </s-text>
            {index < STEPS.length - 1 && (
              <s-text tone="neutral">→</s-text>
            )}
          </s-stack>
        );
      })}
    </s-stack>
  );
}
