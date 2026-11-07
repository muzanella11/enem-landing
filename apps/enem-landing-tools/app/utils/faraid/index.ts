import {
  bagi,
  banding,
  jumlah,
  kali,
  kurang,
  NOL,
  pec,
  tambah,
  type Pecahan,
} from './pecahan';

/**
 * Islamic inheritance (faraid) for the common, agreed cases (Story 45),
 * following the majority (jumhur) view: fixed shares, ashabah, hajb, aul,
 * and radd. Disputed cases are flagged instead of decided.
 */
export interface AhliWaris {
  suami: boolean;
  istri: number;
  anakL: number;
  anakP: number;
  cucuL: number;
  cucuP: number;
  ayah: boolean;
  ibu: boolean;
  kakek: boolean;
  nenekIbu: boolean;
  nenekAyah: boolean;
  saudaraL: number;
  saudariP: number;
  saudaraLSeayah: number;
  saudariSeayah: number;
  saudaraSeibu: number;
}

export const AHLI_WARIS_KOSONG: AhliWaris = {
  suami: false,
  istri: 0,
  anakL: 0,
  anakP: 0,
  cucuL: 0,
  cucuP: 0,
  ayah: false,
  ibu: false,
  kakek: false,
  nenekIbu: false,
  nenekAyah: false,
  saudaraL: 0,
  saudariP: 0,
  saudaraLSeayah: 0,
  saudariSeayah: 0,
  saudaraSeibu: 0,
};

export type Grup = keyof AhliWaris | 'nenek';

export interface BagianGrup {
  grup: Grup;
  label: string;
  jumlahOrang: number;
  /** Share of the whole estate for the group. */
  bagian: Pecahan;
  /** Share per person (males get twice the females in mixed ashabah). */
  perOrang: Pecahan;
  alasan: string[];
}

export interface HasilFaraid {
  bagian: BagianGrup[];
  terhalang: { label: string; oleh: string }[];
  aul: boolean;
  radd: boolean;
  /** Residue with no heir able to take it (e.g. only a spouse, jumhur: baitul mal). */
  sisaTanpaPewaris: Pecahan;
  /** Disputed cases we do not decide. */
  perselisihan: string | null;
}

export const LABEL: Record<Grup, string> = {
  suami: 'Suami',
  istri: 'Istri',
  anakL: 'Anak laki-laki',
  anakP: 'Anak perempuan',
  cucuL: 'Cucu laki-laki (dari anak laki-laki)',
  cucuP: 'Cucu perempuan (dari anak laki-laki)',
  ayah: 'Ayah',
  ibu: 'Ibu',
  kakek: 'Kakek (ayah dari ayah)',
  nenek: 'Nenek',
  nenekIbu: 'Nenek dari pihak ibu',
  nenekAyah: 'Nenek dari pihak ayah',
  saudaraL: 'Saudara laki-laki kandung',
  saudariP: 'Saudara perempuan kandung',
  saudaraLSeayah: 'Saudara laki-laki seayah',
  saudariSeayah: 'Saudara perempuan seayah',
  saudaraSeibu: 'Saudara seibu (laki-laki/perempuan)',
};

interface Fard {
  grup: Grup;
  orang: number;
  bagian: Pecahan;
  alasan: string;
}
interface Ashabah {
  laki: Grup | null;
  nLaki: number;
  perempuan: Grup | null;
  nPerempuan: number;
  alasan: string;
}

export const hitungFaraid = (input: AhliWaris): HasilFaraid => {
  const w = { ...input };
  const n = (v: number | boolean) =>
    typeof v === 'boolean' ? (v ? 1 : 0) : Math.max(0, Math.floor(v));
  const terhalang: HasilFaraid['terhalang'] = [];
  const halang = (grup: keyof AhliWaris, oleh: string) => {
    if (!n(w[grup])) return;
    terhalang.push({ label: LABEL[grup], oleh });
    (w[grup] as number | boolean) = typeof w[grup] === 'boolean' ? false : 0;
  };

  // --- Hajb (blocking) ---
  if (w.anakL) {
    halang('cucuL', 'anak laki-laki');
    halang('cucuP', 'anak laki-laki');
  }
  if (w.anakP >= 2 && !w.cucuL)
    halang('cucuP', 'dua anak perempuan atau lebih');
  if (w.ayah) halang('kakek', 'ayah');
  if (w.ibu) {
    halang('nenekIbu', 'ibu');
    halang('nenekAyah', 'ibu');
  }
  if (w.ayah) halang('nenekAyah', 'ayah');

  const keturunan = n(w.anakL) + n(w.anakP) + n(w.cucuL) + n(w.cucuP) > 0;
  const keturunanL = n(w.anakL) + n(w.cucuL) > 0;
  const keturunanP = !keturunanL && n(w.anakP) + n(w.cucuP) > 0;
  const leluhurL = w.ayah || w.kakek;

  const saudaraAda =
    n(w.saudaraL) + n(w.saudariP) + n(w.saudaraLSeayah) + n(w.saudariSeayah) >
    0;
  if (
    w.kakek &&
    !w.ayah &&
    n(w.saudaraL) + n(w.saudariP) + n(w.saudaraLSeayah) + n(w.saudariSeayah) >
      0 &&
    !keturunanL
  ) {
    return kosong(
      terhalang,
      'Kakek bersama saudara kandung/seayah: ulama berbeda pendapat (jumhur sahabat vs. Abu Bakar). Konsultasikan dengan ahli faraid.',
    );
  }

  if (keturunan || w.ayah)
    halang('saudaraSeibu', keturunan ? 'keturunan pewaris' : 'ayah');
  if (w.kakek) halang('saudaraSeibu', 'kakek');
  const penghalangSaudara = w.anakL
    ? 'anak laki-laki'
    : w.cucuL
      ? 'cucu laki-laki'
      : w.ayah
        ? 'ayah'
        : null;
  if (penghalangSaudara) {
    for (const g of [
      'saudaraL',
      'saudariP',
      'saudaraLSeayah',
      'saudariSeayah',
    ] as const)
      halang(g, penghalangSaudara);
  }
  // Full sister with daughters becomes ashabah ma'al ghair and blocks paternal siblings.
  const saudariMaalGhair = n(w.saudariP) > 0 && !w.saudaraL && keturunanP;
  if (w.saudaraL || saudariMaalGhair) {
    const oleh = w.saudaraL
      ? 'saudara laki-laki kandung'
      : 'saudara perempuan kandung (ashabah bersama anak perempuan)';
    halang('saudaraLSeayah', oleh);
    halang('saudariSeayah', oleh);
  }
  if (n(w.saudariP) >= 2 && !w.saudaraLSeayah)
    halang('saudariSeayah', 'dua saudara perempuan kandung atau lebih');

  // Musytarakah (himariyyah): disputed.
  if (
    w.suami &&
    (w.ibu || w.nenekIbu || w.nenekAyah) &&
    n(w.saudaraSeibu) >= 2 &&
    n(w.saudaraL) > 0 &&
    !keturunan &&
    !leluhurL
  ) {
    return kosong(
      terhalang,
      'Kasus musytarakah (himariyyah): ulama berbeda pendapat apakah saudara kandung ikut berbagi dengan saudara seibu. Konsultasikan dengan ahli faraid.',
    );
  }

  // --- Fixed shares ---
  const fard: Fard[] = [];
  if (w.suami)
    fard.push({
      grup: 'suami',
      orang: 1,
      bagian: pec(1, keturunan ? 4 : 2),
      alasan: keturunan
        ? 'Suami 1/4 karena ada keturunan'
        : 'Suami 1/2 karena tidak ada keturunan',
    });
  if (w.istri)
    fard.push({
      grup: 'istri',
      orang: n(w.istri),
      bagian: pec(1, keturunan ? 8 : 4),
      alasan: `Istri ${keturunan ? '1/8 karena ada keturunan' : '1/4 karena tidak ada keturunan'}${w.istri > 1 ? ', dibagi rata' : ''}`,
    });

  if (w.anakP && !w.anakL)
    fard.push({
      grup: 'anakP',
      orang: n(w.anakP),
      bagian: pec(w.anakP === 1 ? 1 : 2, w.anakP === 1 ? 2 : 3),
      alasan:
        w.anakP === 1
          ? 'Anak perempuan tunggal 1/2'
          : 'Dua anak perempuan atau lebih 2/3',
    });
  if (w.cucuP && !w.cucuL && !w.anakL) {
    if (w.anakP === 1)
      fard.push({
        grup: 'cucuP',
        orang: n(w.cucuP),
        bagian: pec(1, 6),
        alasan: 'Cucu perempuan 1/6 pelengkap 2/3 bersama satu anak perempuan',
      });
    else if (!w.anakP)
      fard.push({
        grup: 'cucuP',
        orang: n(w.cucuP),
        bagian: pec(w.cucuP === 1 ? 1 : 2, w.cucuP === 1 ? 2 : 3),
        alasan:
          w.cucuP === 1
            ? 'Cucu perempuan tunggal 1/2'
            : 'Dua cucu perempuan atau lebih 2/3',
      });
  }

  // Gharrawain: spouse + father + mother only.
  const gharrawain =
    (w.suami || w.istri > 0) &&
    w.ayah &&
    w.ibu &&
    !keturunan &&
    !saudaraAda &&
    !n(w.saudaraSeibu);
  const saudaraTotal =
    n(input.saudaraL) +
    n(input.saudariP) +
    n(input.saudaraLSeayah) +
    n(input.saudariSeayah) +
    n(input.saudaraSeibu);
  if (w.ibu) {
    if (gharrawain) {
      const pasangan = w.suami ? pec(1, 2) : pec(1, 4);
      fard.push({
        grup: 'ibu',
        orang: 1,
        bagian: kali(pec(1, 3), kurang(pec(1), pasangan)),
        alasan:
          'Ibu 1/3 dari sisa setelah bagian suami/istri (gharrawain, pendapat jumhur)',
      });
    } else if (keturunan || saudaraTotal >= 2) {
      fard.push({
        grup: 'ibu',
        orang: 1,
        bagian: pec(1, 6),
        alasan: keturunan
          ? 'Ibu 1/6 karena ada keturunan'
          : 'Ibu 1/6 karena ada dua saudara atau lebih',
      });
    } else
      fard.push({
        grup: 'ibu',
        orang: 1,
        bagian: pec(1, 3),
        alasan:
          'Ibu 1/3 karena tidak ada keturunan dan saudara kurang dari dua',
      });
  }
  const nenek = n(w.nenekIbu) + n(w.nenekAyah);
  if (nenek)
    fard.push({
      grup: 'nenek',
      orang: nenek,
      bagian: pec(1, 6),
      alasan: `Nenek 1/6${nenek > 1 ? ' dibagi rata' : ''} karena tidak ada ibu`,
    });

  const leluhur = w.ayah ? 'ayah' : w.kakek ? 'kakek' : null;
  if (leluhur && keturunan)
    fard.push({
      grup: leluhur as Grup,
      orang: 1,
      bagian: pec(1, 6),
      alasan: `${LABEL[leluhur as Grup]} 1/6 karena ada keturunan`,
    });

  if (w.saudaraSeibu)
    fard.push({
      grup: 'saudaraSeibu',
      orang: n(w.saudaraSeibu),
      bagian: pec(1, w.saudaraSeibu === 1 ? 6 : 3),
      alasan:
        w.saudaraSeibu === 1
          ? 'Saudara seibu tunggal 1/6'
          : 'Saudara seibu dua orang atau lebih 1/3, laki-laki dan perempuan sama',
    });

  if (w.saudariP && !w.saudaraL && !saudariMaalGhair)
    fard.push({
      grup: 'saudariP',
      orang: n(w.saudariP),
      bagian: pec(w.saudariP === 1 ? 1 : 2, w.saudariP === 1 ? 2 : 3),
      alasan:
        w.saudariP === 1
          ? 'Saudara perempuan kandung tunggal 1/2'
          : 'Dua saudara perempuan kandung atau lebih 2/3',
    });
  const saudariSeayahMaalGhair =
    n(w.saudariSeayah) > 0 && !w.saudaraLSeayah && keturunanP;
  if (w.saudariSeayah && !w.saudaraLSeayah && !saudariSeayahMaalGhair) {
    if (w.saudariP === 1)
      fard.push({
        grup: 'saudariSeayah',
        orang: n(w.saudariSeayah),
        bagian: pec(1, 6),
        alasan: 'Saudara perempuan seayah 1/6 pelengkap 2/3',
      });
    else if (!w.saudariP)
      fard.push({
        grup: 'saudariSeayah',
        orang: n(w.saudariSeayah),
        bagian: pec(
          w.saudariSeayah === 1 ? 1 : 2,
          w.saudariSeayah === 1 ? 2 : 3,
        ),
        alasan:
          w.saudariSeayah === 1
            ? 'Saudara perempuan seayah tunggal 1/2'
            : 'Dua saudara perempuan seayah atau lebih 2/3',
      });
  }

  // --- Ashabah (residuary), nearest first ---
  let ashabah: Ashabah | null = null;
  if (w.anakL)
    ashabah = {
      laki: 'anakL',
      nLaki: w.anakL,
      perempuan: w.anakP ? 'anakP' : null,
      nPerempuan: w.anakP,
      alasan: w.anakP
        ? 'Anak laki-laki dan perempuan menerima sisa, laki-laki dua kali perempuan'
        : 'Anak laki-laki menerima sisa (ashabah)',
    };
  else if (w.cucuL)
    ashabah = {
      laki: 'cucuL',
      nLaki: w.cucuL,
      perempuan: w.cucuP ? 'cucuP' : null,
      nPerempuan: w.cucuP,
      alasan:
        'Cucu laki-laki (bersama cucu perempuan) menerima sisa, laki-laki dua kali perempuan',
    };
  else if (leluhur)
    ashabah = {
      laki: leluhur as Grup,
      nLaki: 1,
      perempuan: null,
      nPerempuan: 0,
      alasan: keturunan
        ? `${LABEL[leluhur as Grup]} juga menerima sisa karena keturunan hanya perempuan`
        : `${LABEL[leluhur as Grup]} menerima sisa (ashabah)`,
    };
  else if (w.saudaraL)
    ashabah = {
      laki: 'saudaraL',
      nLaki: w.saudaraL,
      perempuan: w.saudariP ? 'saudariP' : null,
      nPerempuan: w.saudariP,
      alasan: 'Saudara kandung menerima sisa, laki-laki dua kali perempuan',
    };
  else if (saudariMaalGhair)
    ashabah = {
      laki: null,
      nLaki: 0,
      perempuan: 'saudariP',
      nPerempuan: w.saudariP,
      alasan:
        "Saudara perempuan kandung menerima sisa bersama anak/cucu perempuan (ashabah ma'al ghair)",
    };
  else if (w.saudaraLSeayah)
    ashabah = {
      laki: 'saudaraLSeayah',
      nLaki: w.saudaraLSeayah,
      perempuan: w.saudariSeayah ? 'saudariSeayah' : null,
      nPerempuan: w.saudariSeayah,
      alasan: 'Saudara seayah menerima sisa, laki-laki dua kali perempuan',
    };
  else if (saudariSeayahMaalGhair)
    ashabah = {
      laki: null,
      nLaki: 0,
      perempuan: 'saudariSeayah',
      nPerempuan: w.saudariSeayah,
      alasan:
        "Saudara perempuan seayah menerima sisa bersama anak/cucu perempuan (ashabah ma'al ghair)",
    };

  let totalFard = jumlah(fard.map((f) => f.bagian));
  let aul = false;
  let radd = false;
  let sisaTanpaPewaris = NOL;
  const hasil = new Map<
    Grup,
    { bagian: Pecahan; orang: number; alasan: string[] }
  >();
  const catat = (
    grup: Grup,
    bagian: Pecahan,
    orang: number,
    alasan: string,
  ) => {
    const lama = hasil.get(grup);
    if (lama) {
      lama.bagian = tambah(lama.bagian, bagian);
      lama.alasan.push(alasan);
    } else hasil.set(grup, { bagian, orang, alasan: [alasan] });
  };

  if (banding(totalFard, pec(1)) > 0) {
    // Aul: shares exceed the estate, scale all down.
    aul = true;
    for (const f of fard)
      catat(
        f.grup,
        bagi(f.bagian, totalFard),
        f.orang,
        `${f.alasan} (dikurangi secara proporsional karena aul)`,
      );
    totalFard = pec(1);
  } else {
    for (const f of fard) catat(f.grup, f.bagian, f.orang, f.alasan);
  }

  const sisa = kurang(pec(1), totalFard);
  if (sisa.n > 0) {
    if (ashabah) {
      const unit = ashabah.nLaki * 2 + ashabah.nPerempuan;
      if (ashabah.laki)
        catat(
          ashabah.laki,
          kali(sisa, pec(ashabah.nLaki * 2, unit)),
          ashabah.nLaki,
          ashabah.alasan,
        );
      if (ashabah.perempuan)
        catat(
          ashabah.perempuan,
          kali(sisa, pec(ashabah.nPerempuan, unit)),
          ashabah.nPerempuan,
          ashabah.alasan,
        );
    } else {
      // Radd to fixed-share heirs except the spouse.
      const penerima = fard.filter(
        (f) => f.grup !== 'suami' && f.grup !== 'istri',
      );
      const basis = jumlah(penerima.map((f) => f.bagian));
      if (penerima.length) {
        radd = true;
        for (const f of penerima)
          catat(
            f.grup,
            kali(sisa, bagi(f.bagian, basis)),
            f.orang,
            'Ditambah sisa harta (radd) sebanding bagiannya',
          );
      } else sisaTanpaPewaris = sisa;
    }
  }

  return {
    bagian: [...hasil.entries()].map(([grup, v]) => ({
      grup,
      label: LABEL[grup],
      jumlahOrang: v.orang,
      bagian: v.bagian,
      perOrang: bagi(v.bagian, pec(v.orang)),
      alasan: v.alasan,
    })),
    terhalang,
    aul,
    radd,
    sisaTanpaPewaris,
    perselisihan: null,
  };
};

const kosong = (
  terhalang: HasilFaraid['terhalang'],
  perselisihan: string,
): HasilFaraid => ({
  bagian: [],
  terhalang,
  aul: false,
  radd: false,
  sisaTanpaPewaris: NOL,
  perselisihan,
});

/** Estate after funeral costs, debts, and a bequest capped at one third. */
export const hartaBersih = (
  harta: number,
  biayaJenazah: number,
  utang: number,
  wasiat: number,
) => {
  const setelahUtang = Math.max(0, harta - biayaJenazah - utang);
  const wasiatBerlaku = Math.min(Math.max(0, wasiat), setelahUtang / 3);
  return {
    wasiatBerlaku,
    bersih: setelahUtang - wasiatBerlaku,
    wasiatDipotong: wasiat > wasiatBerlaku,
  };
};
