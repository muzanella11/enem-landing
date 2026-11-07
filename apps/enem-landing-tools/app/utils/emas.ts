/** Gold calculator math (Story 38). */

export const nilaiEmas = (gram: number, hargaPerGram: number): number =>
  Math.round(gram * hargaPerGram);

export const gramDariRupiah = (rupiah: number, hargaPerGram: number): number =>
  hargaPerGram > 0 ? Math.floor((rupiah / hargaPerGram) * 1000) / 1000 : 0;

/** Jewelry: weight x purity x pure-gold price, minus the store's making charge (ongkos). */
export const nilaiPerhiasan = (
  gram: number,
  kadarPersen: number,
  hargaMurniPerGram: number,
  ongkos = 0,
): number =>
  Math.max(
    0,
    Math.round(gram * (kadarPersen / 100) * hargaMurniPerGram - ongkos),
  );

export const untungRugi = (
  gram: number,
  hargaBeliPerGram: number,
  hargaSekarangPerGram: number,
) => {
  const modal = Math.round(gram * hargaBeliPerGram);
  const nilai = Math.round(gram * hargaSekarangPerGram);
  return {
    modal,
    nilai,
    selisih: nilai - modal,
    persen: modal > 0 ? ((nilai - modal) / modal) * 100 : 0,
  };
};

/** Change between the last two points of a history, or null. */
export const perubahanHarian = (history: { pricePerGram: number }[]) => {
  if (history.length < 2) return null;
  const last = history[history.length - 1]!.pricePerGram;
  const prev = history[history.length - 2]!.pricePerGram;
  return { rupiah: last - prev, persen: ((last - prev) / prev) * 100 };
};
