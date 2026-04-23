export const smileys = [
  { key: "rood", label: "Helemaal niet leuk" },
  { key: "beige", label: "Niet leuk" },
  { key: "geel", label: "Gewoon" },
  { key: "lichtgroen", label: "Leuk" },
  { key: "groen", label: "Heel leuk" },
];

export const numbers = [
  { key: 1, label: "1 - Slecht" },
  { key: 2, label: "2" },
  { key: 3, label: "3 - Gemiddeld" },
  { key: 4, label: "4" },
  { key: 5, label: "5 - Goed" },
];

export const RATING_LABELS = Object.fromEntries(smileys.map(s => [s.key, s.label]));