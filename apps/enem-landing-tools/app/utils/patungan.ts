/**
 * Split bill (Story 44). Items go to the people who shared them; tax,
 * service, discount, and delivery are spread in proportion to each
 * person's item subtotal. Rounding keeps the grand total exact.
 */
export interface ItemPatungan {
  nama: string;
  harga: number;
  /** Indices of people who share this item; empty = everyone. */
  untuk: number[];
}

export interface InputPatungan {
  orang: string[];
  item: ItemPatungan[];
  pajakPersen: number;
  servicePersen: number;
  diskon: number;
  ongkir: number;
  /** Round each share to this step (1, 100, 500, 1000). */
  pembulatan: number;
}

export interface HasilPatungan {
  subtotal: number;
  total: number;
  perOrang: { nama: string; item: number; bayar: number }[];
}

/** Largest-remainder rounding to `step`; the last odd rupiahs go to the biggest share. */
export const bagiBulat = (
  nilai: number[],
  total: number,
  step: number,
): number[] => {
  const s = Math.max(1, step);
  const dasar = nilai.map((v) => Math.floor(v / s) * s);
  let sisa = total - dasar.reduce((a, b) => a + b, 0);
  const urutan = nilai
    .map((v, i) => ({ i, frac: v - dasar[i]! }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of urutan) {
    if (sisa < s) break;
    dasar[i]! += s;
    sisa -= s;
  }
  if (sisa > 0 && dasar.length) {
    const terbesar = nilai.indexOf(Math.max(...nilai));
    dasar[terbesar]! += sisa;
  }
  return dasar;
};

export const hitungPatungan = (input: InputPatungan): HasilPatungan => {
  const n = input.orang.length;
  const itemPerOrang = Array<number>(n).fill(0);
  for (const item of input.item) {
    const penerima = item.untuk.filter((i) => i >= 0 && i < n);
    const daftar = penerima.length ? penerima : [...Array(n).keys()];
    for (const i of daftar) itemPerOrang[i]! += item.harga / daftar.length;
  }
  const subtotal = input.item.reduce((sum, item) => sum + item.harga, 0);
  const service = subtotal * (input.servicePersen / 100);
  // Restaurant tax is usually charged on subtotal + service.
  const pajak = (subtotal + service) * (input.pajakPersen / 100);
  const total = Math.round(
    Math.max(0, subtotal + service + pajak - input.diskon + input.ongkir),
  );
  const share = itemPerOrang.map((v) =>
    subtotal > 0 ? (v / subtotal) * total : total / Math.max(1, n),
  );
  const bayar = bagiBulat(share, total, input.pembulatan);
  return {
    subtotal,
    total,
    perOrang: input.orang.map((nama, i) => ({
      nama,
      item: itemPerOrang[i]!,
      bayar: bayar[i]!,
    })),
  };
};

export const teksPatungan = (
  hasil: HasilPatungan,
  judul: string,
  rupiah: (n: number) => string,
) =>
  [
    `*${judul || 'Patungan'}*`,
    `Total: ${rupiah(hasil.total)}`,
    '',
    ...hasil.perOrang.map((p) => `- ${p.nama}: ${rupiah(p.bayar)}`),
  ].join('\n');
