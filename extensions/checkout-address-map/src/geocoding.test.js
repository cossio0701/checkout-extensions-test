import { describe, it, expect } from "vitest";
import {
  parseGeocodeResponse,
  coordsToMapsUrl,
  haversineMeters,
} from "./geocoding.js";

/** Respuesta mínima válida estilo Google Geocoding API. */
function okResponse({ hasNumber = true, locationType = "ROOFTOP" } = {}) {
  const components = [{ types: ["route"] }, { types: ["locality"] }];
  if (hasNumber) components.unshift({ types: ["street_number"] });
  return {
    status: "OK",
    results: [
      {
        formatted_address: "Calle 5 #3-20, Bogotá",
        geometry: {
          location: { lat: 4.65, lng: -74.05 },
          location_type: locationType,
        },
        address_components: components,
      },
    ],
  };
}

describe("parseGeocodeResponse", () => {
  it("extrae lat, lng, formatted, hasStreetNumber y locationType de una respuesta válida", () => {
    const r = parseGeocodeResponse(okResponse());
    expect(r).toEqual({
      lat: 4.65,
      lng: -74.05,
      formatted: "Calle 5 #3-20, Bogotá",
      hasStreetNumber: true,
      locationType: "ROOFTOP",
    });
  });

  it("marca hasStreetNumber=false cuando no hay componente street_number", () => {
    expect(parseGeocodeResponse(okResponse({ hasNumber: false })).hasStreetNumber).toBe(
      false,
    );
  });

  it("propaga locationType aproximado", () => {
    expect(
      parseGeocodeResponse(okResponse({ locationType: "APPROXIMATE" })).locationType,
    ).toBe("APPROXIMATE");
  });

  it("devuelve null cuando status no es OK o no hay resultados", () => {
    expect(parseGeocodeResponse({ status: "ZERO_RESULTS", results: [] })).toBeNull();
    expect(parseGeocodeResponse({ status: "OK", results: [] })).toBeNull();
  });

  it("nunca lanza ante entradas malformadas — devuelve null", () => {
    expect(parseGeocodeResponse(null)).toBeNull();
    expect(parseGeocodeResponse(undefined)).toBeNull();
    expect(parseGeocodeResponse({})).toBeNull();
    expect(parseGeocodeResponse("garbage")).toBeNull();
    expect(parseGeocodeResponse({ results: [{}] })).toBeNull();
  });
});

describe("coordsToMapsUrl", () => {
  it("construye un link de Google Maps con las coordenadas", () => {
    expect(coordsToMapsUrl(4.65, -74.05)).toBe(
      "https://www.google.com/maps?q=4.65,-74.05",
    );
  });

  it("devuelve string vacío para coordenadas inválidas", () => {
    expect(coordsToMapsUrl(NaN, -74.05)).toBe("");
    expect(coordsToMapsUrl(4.65, undefined)).toBe("");
    expect(coordsToMapsUrl("a", "b")).toBe("");
    expect(coordsToMapsUrl(200, -74.05)).toBe("");
    expect(coordsToMapsUrl(4.65, -200)).toBe("");
  });
});

describe("haversineMeters", () => {
  it("devuelve 0 para el mismo punto", () => {
    expect(haversineMeters({ lat: 4.65, lng: -74.05 }, { lat: 4.65, lng: -74.05 })).toBe(
      0,
    );
  });

  it("aproxima ~111m para 0.001° de latitud de diferencia", () => {
    const d = haversineMeters({ lat: 4.65, lng: -74.05 }, { lat: 4.651, lng: -74.05 });
    expect(d).toBeGreaterThan(108);
    expect(d).toBeLessThan(114);
  });

  it("devuelve null ante puntos inválidos — nunca lanza", () => {
    expect(haversineMeters(null, { lat: 1, lng: 1 })).toBeNull();
    expect(haversineMeters({ lat: 1, lng: 1 }, undefined)).toBeNull();
    expect(haversineMeters({ lat: "x", lng: 1 }, { lat: 1, lng: 1 })).toBeNull();
  });
});
