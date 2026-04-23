import { describe, it, expect } from "vitest";
import {
  DOC_TYPES,
  DOC_CONFIG,
  validateEcuadorCI,
  validateDocKey,
} from "./doc-validation.js";

describe("DOC_CONFIG", () => {
  it("tiene entrada para cada tipo en DOC_TYPES", () => {
    for (const type of DOC_TYPES) {
      expect(DOC_CONFIG[type]).toBeDefined();
    }
  });

  it("cada config expone label, hint, error y maxLength", () => {
    for (const type of DOC_TYPES) {
      const cfg = DOC_CONFIG[type];
      expect(cfg.label).toBeTypeOf("string");
      expect(cfg.hint).toBeTypeOf("string");
      expect(cfg.error).toBeTypeOf("string");
      expect(cfg.maxLength).toBeTypeOf("number");
      expect(cfg.maxLength).toBeGreaterThan(0);
    }
  });
});

describe("validateEcuadorCI", () => {
  it("acepta una cédula válida", () => {
    // prov=17, 3rd=1, checksum calculado
    expect(validateEcuadorCI("1710034065")).toBe(true);
    expect(validateEcuadorCI("1102345673")).toBe(true);
  });

  it("rechaza cuando no son exactamente 10 dígitos numéricos", () => {
    expect(validateEcuadorCI("")).toBe(false);
    expect(validateEcuadorCI("171003406")).toBe(false);
    expect(validateEcuadorCI("17100340655")).toBe(false);
    expect(validateEcuadorCI("171003406A")).toBe(false);
    expect(validateEcuadorCI("abcdefghij")).toBe(false);
  });

  it("rechaza provincia fuera de rango (1-24)", () => {
    expect(validateEcuadorCI("0010034065")).toBe(false);
    expect(validateEcuadorCI("2510034065")).toBe(false);
    expect(validateEcuadorCI("9910034065")).toBe(false);
  });

  it("rechaza cuando el tercer dígito es mayor a 6", () => {
    // prov=17, 3rd=7 → inválido
    expect(validateEcuadorCI("1770034065")).toBe(false);
    expect(validateEcuadorCI("1790034065")).toBe(false);
  });

  it("rechaza cuando el dígito verificador no coincide", () => {
    // misma cédula válida pero cambiando el último dígito
    expect(validateEcuadorCI("1710034064")).toBe(false);
    expect(validateEcuadorCI("1710034066")).toBe(false);
  });
});

describe("validateDocKey — reglas generales", () => {
  it("valor vacío devuelve errorDocRequired para cualquier tipo", () => {
    for (const type of DOC_TYPES) {
      expect(validateDocKey(type, "")).toBe("errorDocRequired");
    }
  });

  it("tipo desconocido con valor no bloquea", () => {
    expect(validateDocKey("XX9", "12345")).toBeUndefined();
  });

  it("tipo desconocido sin valor sigue pidiendo valor", () => {
    expect(validateDocKey("XX9", "")).toBe("errorDocRequired");
  });
});

describe("validateDocKey — CO3 (Colombia)", () => {
  it("acepta 6 a 10 dígitos", () => {
    expect(validateDocKey("CO3", "123456")).toBeUndefined();
    expect(validateDocKey("CO3", "12345678")).toBeUndefined();
    expect(validateDocKey("CO3", "1234567890")).toBeUndefined();
  });

  it("rechaza menos de 6 o más de 10 dígitos y no-numéricos", () => {
    expect(validateDocKey("CO3", "12345")).toBe("errorCo3");
    expect(validateDocKey("CO3", "12345678901")).toBe("errorCo3");
    expect(validateDocKey("CO3", "12345a")).toBe("errorCo3");
    expect(validateDocKey("CO3", "ABC123")).toBe("errorCo3");
  });
});

describe("validateDocKey — PE3 (Perú)", () => {
  it("acepta exactamente 8 dígitos", () => {
    expect(validateDocKey("PE3", "12345678")).toBeUndefined();
  });

  it("rechaza longitudes distintas o no-numéricos", () => {
    expect(validateDocKey("PE3", "1234567")).toBe("errorPe3");
    expect(validateDocKey("PE3", "123456789")).toBe("errorPe3");
    expect(validateDocKey("PE3", "1234567a")).toBe("errorPe3");
  });
});

describe("validateDocKey — BL3 (Bolivia)", () => {
  it("acepta 4 a 8 dígitos con letra opcional al final", () => {
    expect(validateDocKey("BL3", "1234")).toBeUndefined();
    expect(validateDocKey("BL3", "12345678")).toBeUndefined();
    expect(validateDocKey("BL3", "1234A")).toBeUndefined();
    expect(validateDocKey("BL3", "1234567a")).toBeUndefined();
  });

  it("rechaza menos de 4, más de 8 dígitos o más de una letra", () => {
    expect(validateDocKey("BL3", "123")).toBe("errorBl3");
    expect(validateDocKey("BL3", "123456789")).toBe("errorBl3");
    expect(validateDocKey("BL3", "1234AB")).toBe("errorBl3");
    expect(validateDocKey("BL3", "A1234")).toBe("errorBl3");
  });
});

describe("validateDocKey — CR3 (Costa Rica)", () => {
  it("acepta exactamente 9 dígitos", () => {
    expect(validateDocKey("CR3", "123456789")).toBeUndefined();
  });

  it("rechaza longitudes distintas o no-numéricos", () => {
    expect(validateDocKey("CR3", "12345678")).toBe("errorCr3");
    expect(validateDocKey("CR3", "1234567890")).toBe("errorCr3");
    expect(validateDocKey("CR3", "12345678a")).toBe("errorCr3");
  });
});

describe("validateDocKey — EC3 (Ecuador)", () => {
  it("acepta una cédula con checksum válido", () => {
    expect(validateDocKey("EC3", "1710034065")).toBeUndefined();
  });

  it("rechaza cédulas con provincia inválida, tercer dígito inválido o checksum malo", () => {
    expect(validateDocKey("EC3", "2510034065")).toBe("errorEc3");
    expect(validateDocKey("EC3", "1770034065")).toBe("errorEc3");
    expect(validateDocKey("EC3", "1710034064")).toBe("errorEc3");
    expect(validateDocKey("EC3", "171003406")).toBe("errorEc3");
  });
});

describe("validateDocKey — GT3 (Guatemala)", () => {
  it("acepta exactamente 13 dígitos", () => {
    expect(validateDocKey("GT3", "1234567890123")).toBeUndefined();
  });

  it("rechaza longitudes distintas o no-numéricos", () => {
    expect(validateDocKey("GT3", "123456789012")).toBe("errorGt3");
    expect(validateDocKey("GT3", "12345678901234")).toBe("errorGt3");
    expect(validateDocKey("GT3", "123456789012a")).toBe("errorGt3");
  });
});

describe("validateDocKey — PN3 (Panamá)", () => {
  it("acepta formato N-NNN-NNN con los rangos permitidos", () => {
    expect(validateDocKey("PN3", "1-234-567")).toBeUndefined();
    expect(validateDocKey("PN3", "12-1234-1234")).toBeUndefined();
    expect(validateDocKey("PN3", "8-888-8888")).toBeUndefined();
  });

  it("rechaza formatos inválidos", () => {
    expect(validateDocKey("PN3", "123-456-789")).toBe("errorPn3");
    expect(validateDocKey("PN3", "12-12-1234")).toBe("errorPn3");
    expect(validateDocKey("PN3", "1234567")).toBe("errorPn3");
    expect(validateDocKey("PN3", "A-234-567")).toBe("errorPn3");
  });
});
