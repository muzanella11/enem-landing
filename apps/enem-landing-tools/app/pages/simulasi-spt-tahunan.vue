<script setup lang="ts">
import { PTKP_STATUSES, type PtkpStatus } from '~/data/tax/2026';
import { CHECKED_AT, SUMBER_SPT } from '~/data/tax/usaha';
import { formatRupiah } from '~/utils/format';
import { simulasiSpt } from '~/utils/pajak-usaha';

const SLUG = 'simulasi-spt-tahunan';
const events = useToolEvents(SLUG);
const bukti = ref([{ neto: 0, pph21: 0 }]);
const form = reactive({ ptkp: 'TK/0' as PtkpStatus, lain: 0, zakat: 0 });
const hasil = computed(() =>
  bukti.value.some((b) => b.neto > 0)
    ? simulasiSpt({
        buktiPotong: bukti.value,
        penghasilanLain: form.lain,
        zakat: form.zakat,
        ptkp: form.ptkp,
      })
    : null,
);
let dicatat = false;
watch(hasil, (v) => {
  if (v && !dicatat) {
    dicatat = true;
    events.calculate(bukti.value.length > 1 ? 'dua-pemberi-kerja' : 'satu');
  }
});
const STATUS = {
  'kurang-bayar': 'Kurang bayar',
  'lebih-bayar': 'Lebih bayar',
  nihil: 'Nihil',
};
const faqs = [
  {
    q: 'Kenapa SPT saya kurang bayar padahal gaji sudah dipotong?',
    a: 'Paling sering karena punya dua pemberi kerja dalam setahun atau penghasilan lain. Tiap pemberi kerja memotong pajak seolah-olah hanya mereka sumber penghasilanmu, sehingga lapisan tarif progresif tidak dihitung dari total penghasilan.',
  },
  {
    q: 'Angka apa yang diambil dari bukti potong 1721-A1?',
    a: 'Penghasilan neto setahun (setelah biaya jabatan dan iuran pensiun) dan PPh 21 yang telah dipotong. Isi satu baris untuk setiap bukti potong.',
  },
  {
    q: 'Apakah zakat mengurangi pajak?',
    a: 'Zakat yang dibayar melalui BAZNAS atau LAZ resmi dapat mengurangi penghasilan bruto (PP 60/2010), dengan bukti setor yang sah.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Simulasi SPT Tahunan"
    seo-title="Simulasi SPT Tahunan Karyawan: Kurang Bayar, Lebih Bayar, atau Nihil"
    description="Hitung PPh terutang setahun dari bukti potong 1721-A1 (satu atau dua pemberi kerja) dan penghasilan lain, lalu lihat apakah SPT tahunan kurang bayar, lebih bayar, atau nihil."
    :faqs="faqs"
    application-category="FinanceApplication"
    :sources="SUMBER_SPT"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Simulasi untuk karyawan orang pribadi, bukan konsultasi pajak. Pelaporan dilakukan lewat layanan resmi DJP.',
    ]"
  >
    <section class="card space-y-3">
      <div
        v-for="(b, i) in bukti"
        :key="i"
        class="grid gap-2 sm:grid-cols-[1fr_1fr_2rem]"
      >
        <RupiahInput
          :id="`spt-neto-${i}`"
          v-model="b.neto"
          :label="`Penghasilan neto bukti potong ${i + 1}`"
        />
        <RupiahInput
          :id="`spt-pph-${i}`"
          v-model="b.pph21"
          :label="`PPh 21 dipotong bukti potong ${i + 1}`"
        />
        <button
          v-if="bukti.length > 1"
          type="button"
          class="mt-6 text-rose-700"
          :aria-label="`Hapus bukti potong ${i + 1}`"
          @click="bukti.splice(i, 1)"
        >
          ✕
        </button>
      </div>
      <button
        type="button"
        class="btn-link"
        @click="bukti.push({ neto: 0, pph21: 0 })"
      >
        + Bukti potong pemberi kerja lain
      </button>
      <div class="grid gap-3 sm:grid-cols-3">
        <div>
          <label for="spt-ptkp" class="field-label">Status PTKP</label
          ><select id="spt-ptkp" v-model="form.ptkp" class="field-input">
            <option v-for="s in PTKP_STATUSES" :key="s" :value="s">
              {{ s }}
            </option>
          </select>
        </div>
        <RupiahInput
          id="spt-lain"
          v-model="form.lain"
          label="Penghasilan neto lain (non-final)"
        />
        <RupiahInput
          id="spt-zakat"
          v-model="form.zakat"
          label="Zakat lewat BAZNAS/LAZ"
        />
      </div>
    </section>
    <ResultNote
      text="Simulasi, bukan konsultasi pajak. Cocokkan dengan bukti potong asli sebelum melapor."
    />
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">Status SPT</p>
      <p
        class="tabular text-3xl font-bold"
        :class="
          hasil.status === 'kurang-bayar' ? 'text-rose-800' : 'text-teal-800'
        "
      >
        {{
          STATUS[hasil.status] +
          (hasil.selisih !== 0
            ? ` ${formatRupiah(Math.abs(hasil.selisih))}`
            : '')
        }}
      </p>
      <p class="tabular text-sm">
        Neto {{ formatRupiah(hasil.neto) }} - PTKP
        {{ formatRupiah(hasil.ptkp) }} = PKP {{ formatRupiah(hasil.pkp) }} · PPh
        terutang {{ formatRupiah(hasil.terutang) }} · sudah dipotong
        {{ formatRupiah(hasil.kredit) }}
      </p>
    </section>
    <PajakLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
