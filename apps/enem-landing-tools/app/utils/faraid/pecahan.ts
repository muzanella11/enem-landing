/** Exact fractions so shares always add up to exactly 1 (Story 45). */
export interface Pecahan {
  n: number;
  d: number;
}
const gcd = (a: number, b: number): number =>
  b === 0 ? Math.abs(a) : gcd(b, a % b);
export const pec = (n: number, d = 1): Pecahan => {
  const g = gcd(n, d) || 1;
  const s = d < 0 ? -1 : 1;
  return { n: (s * n) / g, d: (s * d) / g };
};
export const NOL = pec(0);
export const tambah = (a: Pecahan, b: Pecahan) =>
  pec(a.n * b.d + b.n * a.d, a.d * b.d);
export const kurang = (a: Pecahan, b: Pecahan) =>
  pec(a.n * b.d - b.n * a.d, a.d * b.d);
export const kali = (a: Pecahan, b: Pecahan) => pec(a.n * b.n, a.d * b.d);
export const bagi = (a: Pecahan, b: Pecahan) => pec(a.n * b.d, a.d * b.n);
export const banding = (a: Pecahan, b: Pecahan) => a.n * b.d - b.n * a.d;
export const jumlah = (list: Pecahan[]) => list.reduce(tambah, NOL);
export const teks = (p: Pecahan) =>
  p.n === 0 ? '0' : p.d === 1 ? String(p.n) : `${p.n}/${p.d}`;
export const desimal = (p: Pecahan) => p.n / p.d;
