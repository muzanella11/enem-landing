/**
 * Fuel densities used to convert between litres, kg, and tonnes (Story 50).
 * Real density depends on the batch and temperature, so every page shows the
 * value and lets the user change it.
 */
export const MASSA_JENIS = {
  /** Jet A-1 at 15 °C: 775-840 kg/m³ (ASTM D1655, DEF STAN 91-091); 0,8 kg/L is a mid value. */
  avtur: { kgPerLiter: 0.8, rentang: '0,775-0,840 kg/liter pada 15 °C' },
  /** Marine gas oil / HSD: distillate grades in ISO 8217 are at most 0,89 kg/L at 15 °C. */
  solarKapal: {
    kgPerLiter: 0.85,
    rentang: 'maksimal 0,89 kg/liter pada 15 °C (ISO 8217, distilat)',
  },
} as const;

export const SUMBER_MASSA_JENIS = [
  {
    label:
      'ASTM D1655: Standard Specification for Aviation Turbine Fuels (Jet A-1, massa jenis 775-840 kg/m³)',
    url: 'https://www.astm.org/d1655-24.html',
  },
  {
    label:
      'ISO 8217: Petroleum products, fuels (class F), specifications of marine fuels',
    url: 'https://www.iso.org/standard/76503.html',
  },
];
