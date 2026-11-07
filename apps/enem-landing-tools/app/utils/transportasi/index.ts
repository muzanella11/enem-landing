/**
 * Fuel, range, speed, and cost for road vehicles, ships, trains, and
 * aircraft (Story 50). Pure functions with explicit units.
 */

// --- Units ----------------------------------------------------------------

/** km/h per unit. 1 knot = 1 nautical mile (1.852 m) per hour. */
export const KECEPATAN_KE_KMH = {
  kmh: 1,
  ms: 3.6,
  mph: 1.609344,
  knot: 1.852,
} as const;
export type SatuanKecepatan = keyof typeof KECEPATAN_KE_KMH;
/** km per unit. */
export const JARAK_KE_KM = { km: 1, mil: 1.609344, nm: 1.852 } as const;
export type SatuanJarak = keyof typeof JARAK_KE_KM;

// --- Road vehicles --------------------------------------------------------

export const kmPerLiter = (jarakKm: number, liter: number) =>
  liter > 0 ? jarakKm / liter : 0;
export const literPer100Km = (kmpl: number) => (kmpl > 0 ? 100 / kmpl : 0);
export const kmplDariLiterPer100 = (l100: number) =>
  l100 > 0 ? 100 / l100 : 0;

export interface BiayaPerjalanan {
  jarakKm: number;
  liter: number;
  biaya: number;
  biayaPerKm: number;
  biayaPerOrang: number;
}

export const biayaPerjalanan = (input: {
  jarakKm: number;
  kmpl: number;
  hargaPerLiter: number;
  pulangPergi?: boolean;
  penumpang?: number;
}): BiayaPerjalanan => {
  const jarakKm = input.jarakKm * (input.pulangPergi ? 2 : 1);
  const liter = input.kmpl > 0 ? jarakKm / input.kmpl : 0;
  const biaya = liter * input.hargaPerLiter;
  return {
    jarakKm,
    liter,
    biaya,
    biayaPerKm: jarakKm > 0 ? biaya / jarakKm : 0,
    biayaPerOrang: biaya / Math.max(1, input.penumpang ?? 1),
  };
};

/** Distance on `liter` of fuel, keeping `cadanganPersen` of it in reserve. */
export const jarakTempuh = (liter: number, kmpl: number, cadanganPersen = 0) =>
  Math.max(0, liter * (1 - cadanganPersen / 100)) * kmpl;

export const literDariRupiah = (rupiah: number, hargaPerLiter: number) =>
  hargaPerLiter > 0 ? rupiah / hargaPerLiter : 0;

// --- Distance, time, speed ------------------------------------------------

/** Give exactly two of distance (km), time (hours), speed (km/h); returns all three. */
export const jarakWaktuKecepatan = (input: {
  jarakKm?: number | null;
  jam?: number | null;
  kmh?: number | null;
}) => {
  const { jarakKm, jam, kmh } = input;
  if (jarakKm != null && jam != null && jam > 0)
    return { jarakKm, jam, kmh: jarakKm / jam };
  if (jarakKm != null && kmh != null && kmh > 0)
    return { jarakKm, jam: jarakKm / kmh, kmh };
  if (jam != null && kmh != null) return { jarakKm: jam * kmh, jam, kmh };
  return null;
};

export const ZONA = { WIB: 7, WITA: 8, WIT: 9 } as const;
export type Zona = keyof typeof ZONA;

/** "HH:MM" in the departure zone + duration -> arrival "HH:MM" in the arrival zone and days later. */
export const jamTiba = (
  berangkat: string,
  zonaBerangkat: Zona,
  durasiJam: number,
  zonaTiba: Zona,
) => {
  const [h, m] = berangkat.split(':').map(Number) as [number, number];
  const menit =
    h * 60 +
    m +
    Math.round(durasiJam * 60) +
    (ZONA[zonaTiba] - ZONA[zonaBerangkat]) * 60;
  const hari = Math.floor(menit / 1440);
  const sisa = ((menit % 1440) + 1440) % 1440;
  return {
    jam: `${String(Math.floor(sisa / 60)).padStart(2, '0')}:${String(sisa % 60).padStart(2, '0')}`,
    hariKemudian: hari,
  };
};

/** Hours and minutes for display. */
export const formatDurasi = (jam: number) => {
  const total = Math.round(jam * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h} jam${m ? ` ${m} menit` : ''}` : `${m} menit`;
};

// --- Fuel quantities and cost ---------------------------------------------

export type SatuanBahanBakar = 'liter' | 'kg' | 'ton';

export const keLiter = (
  jumlah: number,
  satuan: SatuanBahanBakar,
  kgPerLiter: number,
) =>
  satuan === 'liter'
    ? jumlah
    : (jumlah * (satuan === 'ton' ? 1000 : 1)) / kgPerLiter;
export const dariLiter = (
  liter: number,
  satuan: SatuanBahanBakar,
  kgPerLiter: number,
) =>
  satuan === 'liter'
    ? liter
    : (liter * kgPerLiter) / (satuan === 'ton' ? 1000 : 1);

/** Rupiah for `jumlah` of fuel when the price is quoted per `satuanHarga`. */
export const biayaBahanBakar = (
  jumlah: number,
  satuanJumlah: SatuanBahanBakar,
  harga: number,
  satuanHarga: SatuanBahanBakar,
  kgPerLiter: number,
) =>
  dariLiter(
    keLiter(jumlah, satuanJumlah, kgPerLiter),
    satuanHarga,
    kgPerLiter,
  ) * harga;

// --- Ships ----------------------------------------------------------------

export const hitungKapal = (input: {
  jarakNm: number;
  knot: number;
  /** Fuel per hour in `satuanKonsumsi`, or per day when `perHari`. */
  konsumsi: number;
  perHari: boolean;
  satuanKonsumsi: SatuanBahanBakar;
  cadanganPersen: number;
  tangki?: number;
  harga: number;
  satuanHarga: SatuanBahanBakar;
  kgPerLiter: number;
}) => {
  const jam = input.knot > 0 ? input.jarakNm / input.knot : 0;
  const perJam = input.perHari ? input.konsumsi / 24 : input.konsumsi;
  const perjalanan = perJam * jam;
  const cadangan = (perjalanan * input.cadanganPersen) / 100;
  const biaya = (n: number) =>
    biayaBahanBakar(
      n,
      input.satuanKonsumsi,
      input.harga,
      input.satuanHarga,
      input.kgPerLiter,
    );
  const jelajahNm =
    input.tangki && perJam > 0
      ? ((input.tangki * (1 - input.cadanganPersen / 100)) / perJam) *
        input.knot
      : null;
  return {
    jam,
    perjalanan,
    cadangan,
    biayaPerjalanan: biaya(perjalanan),
    biayaCadangan: biaya(cadangan),
    biayaPerNm: input.jarakNm > 0 ? biaya(perjalanan) / input.jarakNm : 0,
    jelajahNm,
  };
};

// --- Trains ---------------------------------------------------------------

export const waktuKereta = (
  jarakKm: number,
  kmh: number,
  jumlahBerhenti: number,
  menitBerhenti: number,
) => (kmh > 0 ? jarakKm / kmh : 0) + (jumlahBerhenti * menitBerhenti) / 60;

/** Average speed from a timetable; `hari` = days between departure and arrival. */
export const kecepatanDariJadwal = (
  jarakKm: number,
  berangkat: string,
  tiba: string,
  hari = 0,
) => {
  const menit = (t: string) => {
    const [h, m] = t.split(':').map(Number) as [number, number];
    return h * 60 + m;
  };
  let durasi = menit(tiba) - menit(berangkat) + hari * 1440;
  if (durasi <= 0) durasi += 1440;
  return { jam: durasi / 60, kmh: jarakKm / (durasi / 60) };
};

// --- Aircraft -------------------------------------------------------------

/** Ground speed: true airspeed plus tailwind (negative for headwind), both in the same unit. */
export const kecepatanDarat = (kecepatanJelajah: number, angin: number) =>
  Math.max(0, kecepatanJelajah + angin);

export const hitungPesawat = (input: {
  jarakKm: number;
  kecepatanKmh: number;
  anginKmh: number;
  konsumsiPerJam: number;
  satuanKonsumsi: SatuanBahanBakar;
  cadanganPersen: number;
  tangki?: number;
  harga: number;
  satuanHarga: SatuanBahanBakar;
  kgPerLiter: number;
}) => {
  const gs = kecepatanDarat(input.kecepatanKmh, input.anginKmh);
  const jam = gs > 0 ? input.jarakKm / gs : 0;
  const perjalanan = input.konsumsiPerJam * jam;
  const cadangan = (perjalanan * input.cadanganPersen) / 100;
  const biaya = (n: number) =>
    biayaBahanBakar(
      n,
      input.satuanKonsumsi,
      input.harga,
      input.satuanHarga,
      input.kgPerLiter,
    );
  const jelajahKm =
    input.tangki && input.konsumsiPerJam > 0
      ? ((input.tangki * (1 - input.cadanganPersen / 100)) /
          input.konsumsiPerJam) *
        gs
      : null;
  return {
    kecepatanDarat: gs,
    jam,
    perjalanan,
    cadangan,
    biayaPerjalanan: biaya(perjalanan),
    biayaCadangan: biaya(cadangan),
    biayaPerJam: jam > 0 ? biaya(perjalanan) / jam : 0,
    jelajahKm,
  };
};
