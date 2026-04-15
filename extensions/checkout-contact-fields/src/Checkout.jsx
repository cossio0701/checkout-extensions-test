import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useState } from "preact/hooks";
import { useBuyerJourneyIntercept } from "@shopify/ui-extensions/checkout/preact";

export default async () => {
  render(<Extension />, document.body);
};

const DOCUMENT_TYPES = [
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "CE", label: "Cédula de extranjería" },
  { value: "NIT", label: "NIT" },
  { value: "PASSPORT", label: "Pasaporte" },
];

function Extension() {
  const [tipoDoc, setTipoDoc] = useState("");
  const [numDoc, setNumDoc] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [celular, setCelular] = useState("");
  const [errors, setErrors] = useState(
    /** @type {Record<string, string|undefined>} */ ({}),
  );

  // Intercepta el avance del checkout y valida campos
  useBuyerJourneyIntercept(() => {
    const newErrors = /** @type {Record<string, string>} */ ({});
    if (!tipoDoc) newErrors.tipoDoc = "Selecciona el tipo de documento";
    if (!numDoc) newErrors.numDoc = "Ingresa tu número de documento";
    if (!nombres) newErrors.nombres = "Ingresa tus nombres";
    if (!apellidos) newErrors.apellidos = "Ingresa tus apellidos";
    if (!celular) newErrors.celular = "Ingresa tu número de celular";

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
      {/* Tipo de documento */}

      {/* Nombres y apellidos — dos columnas iguales con CSS Grid */}
      <s-grid gridTemplateColumns="1fr 1fr" gap="base">
        <s-select
          label="Tipo de documento"
          value={tipoDoc}
          error={errors.tipoDoc}
          onChange={(e) => {
            const v = e.target.value;
            setTipoDoc(v);
            setErrors((err) => ({ ...err, tipoDoc: undefined }));
            saveAttribute("tipo_documento", v);
          }}
        >
          <s-option value="">Selecciona...</s-option>
          {DOCUMENT_TYPES.map((d) => (
            <s-option key={d.value} value={d.value}>
              {d.label}
            </s-option>
          ))}
        </s-select>

        {/* Número de documento */}
        <s-text-field
          label="Número de documento"
          value={numDoc}
          error={errors.numDoc}
          onInput={(e) => {
            const v = e.target.value;
            setNumDoc(v);
            setErrors((err) => ({ ...err, numDoc: undefined }));
            saveAttribute("numero_documento", v);
          }}
        />
      </s-grid>

      {/* Celular */}
      <s-text-field
        label="Número de celular"
        value={celular}
        error={errors.celular}
        onInput={(e) => {
          const v = e.target.value;
          setCelular(v);
          setErrors((err) => ({ ...err, celular: undefined }));
          saveAttribute("celular", v);
        }}
      />
    </s-stack>
  );
}
