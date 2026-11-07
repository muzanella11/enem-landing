<script setup lang="ts">
import {
  CATATAN_PPH_UMKM,
  CHECKED_AT,
  JENIS_WP,
  PPH_UMKM,
  SUMBER_PPH_UMKM,
  type JenisWp,
} from '~/data/umkm';
import { formatRupiah } from '~/utils/format';
import { hitungPphUmkm } from '~/utils/umkm';

const SLUG = 'kalkulator-pph-umkm';
const events = useToolEvents(SLUG);
const form = reactive({ jenis: 'op' as JenisWp, omzet: 0, omzetSebelumnya: 0 });
const hasil = ref<ReturnType<typeof hitungPphUmkm> | null>(null);
const hitung = () => {
  hasil.value = hitungPphUmkm(form.jenis, form.omzet, form.omzetSebelumnya);
  events.calculate(form.jenis);
};
const faqs = [
  {
    q: 'Berapa PPh final UMKM?',
    a: 'Tarif 0,5% dari omzet bruto bulanan, bagi wajib pajak dengan omzet sampai Rp4,8 miliar setahun (PP 55/2022, diubah PP 20/2026).',
  },
  {
    q: 'Benarkah omzet sampai Rp500 juta tidak kena pajak?',
    a: 'Ya, untuk wajib pajak orang pribadi: omzet Rp500 juta pertama dalam satu tahun pajak tidak dikenai PPh. Perseroan perorangan dan koperasi tidak mendapat pembebasan ini.',
  },
  {
    q: 'Siapa yang tidak bisa memakai tarif 0,5%?',
    a: 'Sejak PP 20/2026: CV, firma, PT, dan BUMDes baru, serta orang pribadi dengan penghasilan dari jasa pekerjaan bebas seperti dokter, notaris, konsultan, dan seniman.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator PPh Final UMKM 0,5%"
    seo-title="Kalkulator PPh Final UMKM 0,5% (PP 55/2022 dan PP 20/2026)"
    description="Hitung PPh final UMKM 0,5% per bulan, termasuk omzet Rp500 juta bebas pajak untuk orang pribadi, sesuai PP 55/2022 yang diubah PP 20/2026."
    :faqs="faqs"
    application-category="BusinessApplication"
    :sources="SUMBER_PPH_UMKM"
    :checked-at="CHECKED_AT"
    :caveats="CATATAN_PPH_UMKM"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <div class="sm:col-span-2">
        <label for="pph-jenis" class="field-label">Jenis wajib pajak</label>
        <select id="pph-jenis" v-model="form.jenis" class="field-input">
          <option v-for="j in JENIS_WP" :key="j.id" :value="j.id">
            {{ j.label }}
          </option>
        </select>
      </div>
      <RupiahInput
        id="pph-omzet"
        v-model="form.omzet"
        label="Omzet bulan ini"
      />
      <RupiahInput
        id="pph-sebelumnya"
        v-model="form.omzetSebelumnya"
        label="Omzet Januari s.d. bulan lalu"
        hint="Untuk menghitung sisa Rp500 juta bebas pajak."
      />
      <button type="submit" class="btn-primary sm:col-span-2">
        Hitung PPh
      </button>
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <template v-if="hasil.berhak">
        <p class="text-sm text-slate-600">PPh final bulan ini</p>
        <p class="tabular text-3xl font-bold text-teal-800">
          {{ formatRupiah(hasil.pph) }}
        </p>
        <p class="tabular text-sm">
          Omzet kena pajak {{ formatRupiah(hasil.omzetKenaPajak)
          }}<template v-if="form.jenis === 'op'"
            >; sisa omzet bebas pajak tahun ini
            {{ formatRupiah(hasil.sisaBebas) }}</template
          >.
        </p>
      </template>
      <p v-else class="text-3xl font-bold text-rose-800">
        Tidak bisa memakai tarif 0,5%
      </p>
      <p v-if="hasil.melewatiBatas" class="text-sm text-amber-800">
        Omzet tahun ini melewati {{ formatRupiah(PPH_UMKM.batasOmzetTahunan) }};
        tarif 0,5% tidak bisa dipakai lagi. Konsultasikan dengan konsultan
        pajak.
      </p>
    </section>
    <UmkmLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
