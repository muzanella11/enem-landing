/** Grade scales for the GPA calculator (Story 35). Every campus differs; the custom scale covers the rest. */
export interface SkalaNilai {
  id: string;
  label: string;
  nilai: { huruf: string; bobot: number }[];
}

export const SKALA_NILAI: SkalaNilai[] = [
  {
    id: 'ab',
    label: 'A, AB, B, BC, C, D, E',
    nilai: [
      { huruf: 'A', bobot: 4 },
      { huruf: 'AB', bobot: 3.5 },
      { huruf: 'B', bobot: 3 },
      { huruf: 'BC', bobot: 2.5 },
      { huruf: 'C', bobot: 2 },
      { huruf: 'D', bobot: 1 },
      { huruf: 'E', bobot: 0 },
    ],
  },
  {
    id: 'plusminus',
    label: 'A, A-, B+, B, B-, C+, C, D, E',
    nilai: [
      { huruf: 'A', bobot: 4 },
      { huruf: 'A-', bobot: 3.7 },
      { huruf: 'B+', bobot: 3.3 },
      { huruf: 'B', bobot: 3 },
      { huruf: 'B-', bobot: 2.7 },
      { huruf: 'C+', bobot: 2.3 },
      { huruf: 'C', bobot: 2 },
      { huruf: 'D', bobot: 1 },
      { huruf: 'E', bobot: 0 },
    ],
  },
];

/** Common graduation honors for undergraduate programs; campuses may add conditions (study length, no repeats). */
export const PREDIKAT = [
  { min: 3.51, label: 'Pujian (cumlaude)' },
  { min: 3.01, label: 'Sangat memuaskan' },
  { min: 2.76, label: 'Memuaskan' },
] as const;
