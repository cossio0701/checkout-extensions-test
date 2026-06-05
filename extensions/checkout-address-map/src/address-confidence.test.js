import { describe, it, expect } from "vitest";
import {
  assessAddress,
  REASON,
  PIN_FAR_METERS,
} from "./address-confidence.js";

describe("assessAddress", () => {
  it("una dirección con número, pin cercano y ubicación precisa NO es riesgosa", () => {
    const r = assessAddress({
      hasStreetNumber: true,
      pinMovedMeters: 10,
      locationType: "ROOFTOP",
    });
    expect(r).toEqual({ risky: false, reasons: [] });
  });

  it("marca noStreetNumber cuando falta el número", () => {
    const r = assessAddress({ hasStreetNumber: false, locationType: "ROOFTOP" });
    expect(r.risky).toBe(true);
    expect(r.reasons).toContain(REASON.NO_STREET_NUMBER);
  });

  it("marca pinFar cuando el pin se movió más del umbral", () => {
    const r = assessAddress({
      hasStreetNumber: true,
      pinMovedMeters: PIN_FAR_METERS + 1,
      locationType: "ROOFTOP",
    });
    expect(r.risky).toBe(true);
    expect(r.reasons).toContain(REASON.PIN_FAR);
  });

  it("no marca pinFar justo en el umbral", () => {
    const r = assessAddress({
      hasStreetNumber: true,
      pinMovedMeters: PIN_FAR_METERS,
      locationType: "ROOFTOP",
    });
    expect(r.reasons).not.toContain(REASON.PIN_FAR);
  });

  it("marca approximateLocation para tipos imprecisos", () => {
    for (const lt of ["APPROXIMATE", "GEOMETRIC_CENTER"]) {
      const r = assessAddress({ hasStreetNumber: true, locationType: lt });
      expect(r.reasons).toContain(REASON.APPROXIMATE);
    }
  });

  it("acumula múltiples razones", () => {
    const r = assessAddress({
      hasStreetNumber: false,
      pinMovedMeters: 500,
      locationType: "APPROXIMATE",
    });
    expect(r.risky).toBe(true);
    expect(r.reasons).toEqual(
      expect.arrayContaining([
        REASON.NO_STREET_NUMBER,
        REASON.PIN_FAR,
        REASON.APPROXIMATE,
      ]),
    );
  });

  it("ante datos desconocidos no inventa riesgo y nunca lanza", () => {
    expect(assessAddress(undefined)).toEqual({ risky: false, reasons: [] });
    expect(assessAddress({})).toEqual({ risky: false, reasons: [] });
    expect(assessAddress({ pinMovedMeters: null, locationType: undefined })).toEqual({
      risky: false,
      reasons: [],
    });
  });
});
