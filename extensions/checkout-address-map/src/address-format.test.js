import { describe, it, expect } from "vitest";
import { composeTextWithLink, cleanText } from "./address-format.js";

describe("cleanText", () => {
  it("recorta y colapsa espacios", () => {
    expect(cleanText("  Calle   5   #3 ")).toBe("Calle 5 #3");
  });

  it("devuelve string vacío ante valores no-string", () => {
    expect(cleanText(undefined)).toBe("");
    expect(cleanText(null)).toBe("");
    expect(cleanText(123)).toBe("");
  });
});

describe("composeTextWithLink", () => {
  const addr = "Calle 5 #3-20, Bogotá";
  const ref = "portón negro";
  const url = "https://www.google.com/maps?q=4.65,-74.05";

  it("une dirección, referencia y link", () => {
    expect(composeTextWithLink(addr, ref, url)).toBe(
      "Calle 5 #3-20, Bogotá — portón negro 📍 https://www.google.com/maps?q=4.65,-74.05",
    );
  });

  it("omite la referencia cuando no hay", () => {
    expect(composeTextWithLink(addr, "", url)).toBe(
      "Calle 5 #3-20, Bogotá 📍 https://www.google.com/maps?q=4.65,-74.05",
    );
  });

  it("omite el link cuando no hay", () => {
    expect(composeTextWithLink(addr, ref, "")).toBe("Calle 5 #3-20, Bogotá — portón negro");
  });

  it("devuelve solo la dirección cuando no hay referencia ni link", () => {
    expect(composeTextWithLink(addr, "", "")).toBe("Calle 5 #3-20, Bogotá");
  });

  it("nunca lanza ante entradas vacías", () => {
    expect(composeTextWithLink("", "", "")).toBe("");
    expect(composeTextWithLink(undefined, undefined, undefined)).toBe("");
  });
});
