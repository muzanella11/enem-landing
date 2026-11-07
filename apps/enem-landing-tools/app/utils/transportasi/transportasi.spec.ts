import { describe, expect, it } from 'vitest';
import {
  biayaBahanBakar,
  biayaPerjalanan,
  formatDurasi,
  hitungKapal,
  hitungPesawat,
  jamTiba,
  jarakTempuh,
  jarakWaktuKecepatan,
  kecepatanDariJadwal,
  KECEPATAN_KE_KMH,
  kmPerLiter,
  kmplDariLiterPer100,
  literDariRupiah,
  literPer100Km,
  waktuKereta,
} from './index.js';

describe('kendaraan darat', () => {
  it('km/liter and liter/100 km both ways', () => {
    expect(kmPerLiter(450, 30)).toBe(15);
    expect(literPer100Km(12.5)).toBe(8);
    expect(kmplDariLiterPer100(8)).toBe(12.5);
    expect(kmPerLiter(100, 0)).toBe(0);
  });

  it('trip cost: round trip, per km, per person', () => {
    const r = biayaPerjalanan({
      jarakKm: 150,
      kmpl: 12,
      hargaPerLiter: 10_000,
      pulangPergi: true,
      penumpang: 4,
    });
    expect(r.jarakKm).toBe(300);
    expect(r.liter).toBe(25);
    expect(r.biaya).toBe(250_000);
    expect(r.biayaPerKm).toBeCloseTo(833.33, 2);
    expect(r.biayaPerOrang).toBe(62_500);
  });

  it('range with reserve and litres from rupiah', () => {
    expect(jarakTempuh(40, 14, 10)).toBe(504);
    expect(literDariRupiah(100_000, 10_000)).toBe(10);
  });
});

describe('jarak, waktu, kecepatan', () => {
  it('every pair of inputs', () => {
    expect(jarakWaktuKecepatan({ jarakKm: 300, jam: 5 })).toEqual({
      jarakKm: 300,
      jam: 5,
      kmh: 60,
    });
    expect(jarakWaktuKecepatan({ jarakKm: 300, kmh: 80 })).toEqual({
      jarakKm: 300,
      jam: 3.75,
      kmh: 80,
    });
    expect(jarakWaktuKecepatan({ jam: 2, kmh: 90 })).toEqual({
      jarakKm: 180,
      jam: 2,
      kmh: 90,
    });
    expect(jarakWaktuKecepatan({ jarakKm: 1 })).toBeNull();
  });

  it('knots and nautical miles', () => {
    expect(10 * KECEPATAN_KE_KMH.knot).toBeCloseTo(18.52, 10);
  });

  it('arrival across midnight and time zones', () => {
    expect(jamTiba('22:30', 'WIB', 3, 'WIB')).toEqual({
      jam: '01:30',
      hariKemudian: 1,
    });
    // Jakarta 08:00 WIB, 2 h flight to Makassar (WITA, +1 h)
    expect(jamTiba('08:00', 'WIB', 2, 'WITA')).toEqual({
      jam: '11:00',
      hariKemudian: 0,
    });
    // Jayapura 23:30 WIT, 5 h 30 m to Jakarta (WIB, -2 h)
    expect(jamTiba('23:30', 'WIT', 5.5, 'WIB')).toEqual({
      jam: '03:00',
      hariKemudian: 1,
    });
    expect(formatDurasi(3.75)).toBe('3 jam 45 menit');
  });
});

describe('biaya bahan bakar', () => {
  it('litre, kg, and ton prices with density', () => {
    expect(biayaBahanBakar(100, 'liter', 10_000, 'liter', 0.8)).toBe(1_000_000);
    // 800 kg avtur at 0,8 kg/L = 1.000 L, priced per litre
    expect(biayaBahanBakar(800, 'kg', 12_000, 'liter', 0.8)).toBeCloseTo(
      12_000_000,
      6,
    );
    // 2.000 L marine fuel at 0,85 = 1,7 ton, priced per ton
    expect(biayaBahanBakar(2000, 'liter', 15_000_000, 'ton', 0.85)).toBeCloseTo(
      25_500_000,
      6,
    );
  });
});

describe('kapal', () => {
  it('time, fuel per day, reserve, cost, range', () => {
    const r = hitungKapal({
      jarakNm: 120,
      knot: 12,
      konsumsi: 2.4,
      perHari: true,
      satuanKonsumsi: 'ton',
      cadanganPersen: 10,
      tangki: 24,
      harga: 15_000_000,
      satuanHarga: 'ton',
      kgPerLiter: 0.85,
    });
    expect(r.jam).toBe(10);
    expect(r.perjalanan).toBeCloseTo(1, 10);
    expect(r.cadangan).toBeCloseTo(0.1, 10);
    expect(r.biayaPerjalanan).toBeCloseTo(15_000_000, 4);
    expect(r.biayaCadangan).toBeCloseTo(1_500_000, 4);
    expect(r.biayaPerNm).toBeCloseTo(125_000, 4);
    // 24 t x 90% / 0,1 t/h = 216 h x 12 kn
    expect(r.jelajahNm).toBeCloseTo(2592, 6);
  });
});

describe('kereta', () => {
  it('stops add time; average speed across midnight', () => {
    expect(waktuKereta(700, 70, 6, 5)).toBeCloseTo(10.5, 10);
    expect(kecepatanDariJadwal(720, '20:00', '04:00')).toEqual({
      jam: 8,
      kmh: 90,
    });
    expect(kecepatanDariJadwal(100, '08:00', '09:00', 1).jam).toBe(25);
  });
});

describe('pesawat', () => {
  it('head and tail wind, fuel in kg priced per litre, reserve', () => {
    const base = {
      jarakKm: 1400,
      kecepatanKmh: 800,
      konsumsiPerJam: 2400,
      satuanKonsumsi: 'kg' as const,
      cadanganPersen: 10,
      harga: 12_000,
      satuanHarga: 'liter' as const,
      kgPerLiter: 0.8,
    };
    const angin = hitungPesawat({ ...base, anginKmh: -100 });
    expect(angin.kecepatanDarat).toBe(700);
    expect(angin.jam).toBe(2);
    expect(angin.perjalanan).toBe(4800);
    // 4.800 kg / 0,8 = 6.000 L x Rp12.000
    expect(angin.biayaPerjalanan).toBeCloseTo(72_000_000, 4);
    expect(angin.biayaCadangan).toBeCloseTo(7_200_000, 4);
    expect(angin.biayaPerJam).toBeCloseTo(36_000_000, 4);
    expect(hitungPesawat({ ...base, anginKmh: 100 }).jam).toBeCloseTo(
      1400 / 900,
      10,
    );
  });
});
