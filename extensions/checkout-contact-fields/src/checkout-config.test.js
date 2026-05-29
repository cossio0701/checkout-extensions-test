import { describe, it, expect } from "vitest";
import {
  parseCheckoutConfig,
  resolveEnabledDocTypes,
  resolveDocLabels,
} from "./checkout-config.js";
import { DOC_TYPES } from "./doc-validation.js";

describe("parseCheckoutConfig", () => {
  it("devuelve null para valores ausentes o vacíos", () => {
    expect(parseCheckoutConfig(undefined)).toBeNull();
    expect(parseCheckoutConfig(null)).toBeNull();
    expect(parseCheckoutConfig("")).toBeNull();
  });

  it("devuelve null para JSON malformado en vez de lanzar", () => {
    expect(parseCheckoutConfig("{ not json")).toBeNull();
    expect(parseCheckoutConfig("undefined")).toBeNull();
  });

  it("parsea un objeto de config válido", () => {
    const raw = JSON.stringify({ contact_fields: { enabled_doc_types: ["CO3"] } });
    expect(parseCheckoutConfig(raw)).toEqual({
      contact_fields: { enabled_doc_types: ["CO3"] },
    });
  });

  it("acepta JSON válido que no es objeto sin romperse", () => {
    expect(parseCheckoutConfig("123")).toBe(123);
    expect(parseCheckoutConfig("null")).toBeNull();
  });
});

describe("resolveEnabledDocTypes — blindaje anti-bloqueo", () => {
  it("devuelve TODOS los tipos si la config es null", () => {
    expect(resolveEnabledDocTypes(null)).toEqual(DOC_TYPES);
  });

  it("devuelve TODOS los tipos si enabled_doc_types está ausente", () => {
    expect(resolveEnabledDocTypes({ contact_fields: {} })).toEqual(DOC_TYPES);
  });

  it("devuelve TODOS los tipos si enabled_doc_types es un array vacío", () => {
    expect(
      resolveEnabledDocTypes({ contact_fields: { enabled_doc_types: [] } }),
    ).toEqual(DOC_TYPES);
  });

  it("devuelve TODOS los tipos si enabled_doc_types no es un array", () => {
    expect(
      resolveEnabledDocTypes({ contact_fields: { enabled_doc_types: "CO3" } }),
    ).toEqual(DOC_TYPES);
  });

  it("filtra al subconjunto configurado", () => {
    const config = { contact_fields: { enabled_doc_types: ["CO3", "EC3"] } };
    expect(resolveEnabledDocTypes(config)).toEqual(["CO3", "EC3"]);
  });

  it("ignora códigos desconocidos", () => {
    const config = {
      contact_fields: { enabled_doc_types: ["CO3", "XX9", "ZZ1"] },
    };
    expect(resolveEnabledDocTypes(config)).toEqual(["CO3"]);
  });

  it("preserva el orden de la tabla, no el del array configurado", () => {
    const config = { contact_fields: { enabled_doc_types: ["PN3", "CO3"] } };
    expect(resolveEnabledDocTypes(config)).toEqual(["CO3", "PN3"]);
  });
});

describe("resolveDocLabels", () => {
  it("devuelve {} si la config es null", () => {
    expect(resolveDocLabels(null)).toEqual({});
  });

  it("devuelve {} si doc_type_labels está ausente", () => {
    expect(resolveDocLabels({ contact_fields: {} })).toEqual({});
  });

  it("devuelve {} si doc_type_labels no es un objeto", () => {
    expect(
      resolveDocLabels({ contact_fields: { doc_type_labels: "abc" } }),
    ).toEqual({});
  });

  it("devuelve el mapa de labels custom cuando es válido", () => {
    const config = {
      contact_fields: { doc_type_labels: { CO3: "Mi cédula" } },
    };
    expect(resolveDocLabels(config)).toEqual({ CO3: "Mi cédula" });
  });
});
