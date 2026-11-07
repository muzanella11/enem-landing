import {
  KATEGORI_OJK,
  KECELAKAAN_DIRI,
  LOADING_USIA,
  PERLUASAN,
  PROVINSI_WILAYAH_1,
  PROVINSI_WILAYAH_2,
  TJH_BERTINGKAT,
  type JenisJaminan,
  type JenisKendaraan,
  type JenisPerluasan,
  type Wilayah,
} from '../data/asuransi/tarif-ojk';

/** Motor vehicle insurance premium ranges (Story 51). Results are [min, max] rupiah. */
export type Rentang = [number, number];

export const wilayahProvinsi = (provinsi: string): Wilayah =>
  PROVINSI_WILAYAH_1.includes(provinsi)
    ? 1
    : PROVINSI_WILAYAH_2.includes(provinsi)
      ? 2
      : 3;

export const cariKategori = (jenis: JenisKendaraan, nilai: number) =>
  KATEGORI_OJK.find(
    (k) => k.jenis === jenis && (k.sampai === null || nilai <= k.sampai),
  )!;

/** Progressive third-party liability premium for a limit. */
export const premiTjh = (limit: number) => {
  let sisa = Math.max(0, limit);
  let bawah = 0;
  let premi = 0;
  for (const tingkat of TJH_BERTINGKAT) {
    const porsi = Math.min(sisa, tingkat.sampai - bawah);
    if (porsi <= 0) break;
    premi += (porsi * tingkat.persen) / 100;
    sisa -= porsi;
    bawah = tingkat.sampai;
  }
  return premi;
};

export interface InputPremi {
  jenis: JenisKendaraan;
  wilayah: Wilayah;
  nilai: number;
  jaminan: JenisJaminan;
  /** Vehicle age in years at the start of cover. */
  usia: number;
  perluasan: JenisPerluasan[];
  tjhLimit?: number;
  paPengemudi?: number;
  paPenumpang?: number;
  jumlahPenumpang?: number;
}

export interface RincianPremi {
  label: string;
  tarif: Rentang | null;
  premi: Rentang;
}

export const hitungPremi = (input: InputPremi) => {
  const kategori = cariKategori(input.jenis, input.nilai);
  const [min, max] = kategori[input.jaminan][input.wilayah - 1]!;
  const rincian: RincianPremi[] = [];
  const persen = (r: Rentang): Rentang => [
    (input.nilai * r[0]) / 100,
    (input.nilai * r[1]) / 100,
  ];
  rincian.push({
    label:
      input.jaminan === 'comprehensive'
        ? 'Comprehensive (all risk)'
        : 'Total Loss Only (TLO)',
    tarif: [min, max],
    premi: persen([min, max]),
  });
  const tahunLebih = Math.max(
    0,
    Math.ceil(input.usia) - LOADING_USIA.mulaiTahun,
  );
  if (input.jaminan === 'comprehensive' && tahunLebih > 0) {
    const faktor = (LOADING_USIA.persenPerTahun * tahunLebih) / 100;
    rincian.push({
      label: `Tambahan usia kendaraan ${tahunLebih} tahun di atas 5 tahun`,
      tarif: [min * faktor, max * faktor],
      premi: persen([min * faktor, max * faktor]),
    });
  }
  for (const p of input.perluasan) {
    const tarif = PERLUASAN[p].tarif[input.wilayah - 1]!;
    rincian.push({ label: PERLUASAN[p].label, tarif, premi: persen(tarif) });
  }
  if (input.tjhLimit) {
    const premi = premiTjh(input.tjhLimit);
    rincian.push({
      label: `Tanggung jawab hukum pihak ketiga (limit Rp${input.tjhLimit.toLocaleString('id-ID')})`,
      tarif: null,
      premi: [premi, premi],
    });
  }
  if (input.paPengemudi) {
    const premi = (input.paPengemudi * KECELAKAAN_DIRI.pengemudiPersen) / 100;
    rincian.push({
      label: 'Kecelakaan diri pengemudi',
      tarif: null,
      premi: [premi, premi],
    });
  }
  if (input.paPenumpang && input.jumlahPenumpang) {
    const premi =
      (input.paPenumpang *
        KECELAKAAN_DIRI.penumpangPersen *
        input.jumlahPenumpang) /
      100;
    rincian.push({
      label: `Kecelakaan diri ${input.jumlahPenumpang} penumpang`,
      tarif: null,
      premi: [premi, premi],
    });
  }
  const total: Rentang = [
    rincian.reduce((s, r) => s + r.premi[0], 0),
    rincian.reduce((s, r) => s + r.premi[1], 0),
  ];
  return { kategori, rincian, total };
};

/** Premium per year over a loan term, with the sum insured depreciating each year. */
export const simulasiTahunan = (
  input: InputPremi,
  tahun: number,
  penyusutanPersen: number,
) =>
  Array.from({ length: Math.max(1, tahun) }, (_, i) => {
    const nilai = input.nilai * (1 - penyusutanPersen / 100) ** i;
    const hasil = hitungPremi({ ...input, nilai, usia: input.usia + i });
    return {
      tahunKe: i + 1,
      nilai,
      kategori: hasil.kategori.kategori,
      total: hasil.total,
    };
  });

/** Premium for a rate from the user's own quote. */
export const premiDariTarif = (nilai: number, tarifPersen: number) =>
  (nilai * tarifPersen) / 100;
