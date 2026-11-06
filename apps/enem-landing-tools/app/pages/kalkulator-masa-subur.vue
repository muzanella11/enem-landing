<script setup lang="ts">
import { CHECKED_AT, SUMBER } from '~/data/kesehatan';
import { masaSubur } from '~/utils/kesehatan';
import { formatTanggal } from '~/utils/surat/format';

const SLUG = 'kalkulator-masa-subur';
const events = useToolEvents(SLUG);
const form = reactive({ hpht: '', siklus: 28 });
const hasil = ref<ReturnType<typeof masaSubur>>([]);

onMounted(() => {
  const shared = useSharedState<typeof form>(SLUG);
  if (shared) {
    Object.assign(form, shared);
    hitung();
  }
});
const hitung = () => {
  if (!form.hpht) return;
  form.siklus = Math.min(45, Math.max(21, Number(form.siklus) || 28));
  hasil.value = masaSubur(form.hpht, form.siklus, 3);
  events.calculate(form.siklus === 28 ? '28' : 'lain');
};
const pendek = (iso: string) => formatTanggal(iso).replace(/ \d{4}$/, '');
const faqs = [
  {
    q: 'Bagaimana masa subur dihitung?',
    a: 'Ovulasi diperkirakan terjadi sekitar 14 hari sebelum haid berikutnya (panjang siklus dikurangi 14). Masa subur sekitar 5 hari sebelum sampai 1 hari setelah ovulasi, karena sperma bisa bertahan beberapa hari.',
  },
  {
    q: 'Bisakah kalender masa subur dipakai untuk mencegah kehamilan?',
    a: 'Jangan mengandalkan kalkulator ini untuk KB. Waktu ovulasi bisa bergeser dari siklus ke siklus. Untuk kontrasepsi, konsultasikan metode yang tepat dengan bidan atau dokter.',
  },
  {
    q: 'Bagaimana jika siklus haid tidak teratur?',
    a: 'Perkiraan menjadi kurang akurat. Tes ovulasi (LH) atau pemeriksaan ke dokter lebih bisa diandalkan.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Masa Subur"
    seo-title="Kalkulator Masa Subur dan Perkiraan Ovulasi"
    description="Perkirakan tanggal ovulasi dan masa subur untuk tiga siklus ke depan dari HPHT dan panjang siklus haid. Diproses di perangkat Anda."
    application-category="HealthApplication"
    :faqs="faqs"
    :how-to="[
      'Isi hari pertama haid terakhir (HPHT).',
      'Isi panjang siklus haid rata-rata.',
      'Tekan Hitung masa subur.',
    ]"
    :sources="SUMBER.subur"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Bukan metode kontrasepsi. Siklus tidak teratur membuat perkiraan kurang akurat.',
    ]"
    medical
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <div>
        <label for="subur-hpht" class="field-label"
          >Hari pertama haid terakhir (HPHT)</label
        >
        <input
          id="subur-hpht"
          v-model="form.hpht"
          type="date"
          class="field-input"
        />
      </div>
      <div>
        <label for="subur-siklus" class="field-label"
          >Panjang siklus haid (hari)</label
        >
        <input
          id="subur-siklus"
          v-model.number="form.siklus"
          type="number"
          min="21"
          max="45"
          class="field-input"
        />
      </div>
      <button type="submit" class="btn-primary sm:col-span-2">
        Hitung masa subur
      </button>
    </form>
    <template v-if="hasil.length">
      <HealthDisclaimer
        extra="Jangan memakai hasil ini sebagai metode pencegahan kehamilan."
      />
      <section class="card" aria-live="polite">
        <table class="tabular w-full text-sm">
          <thead class="text-left text-slate-500">
            <tr>
              <th class="py-2 font-medium">Siklus mulai</th>
              <th class="py-2 font-medium">Masa subur</th>
              <th class="py-2 font-medium">Perkiraan ovulasi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in hasil"
              :key="s.haid"
              class="border-t border-slate-100"
            >
              <td class="py-2">{{ pendek(s.haid) }}</td>
              <td class="py-2 font-semibold text-teal-800">
                {{ pendek(s.suburMulai) }} - {{ pendek(s.suburSelesai) }}
              </td>
              <td class="py-2">{{ pendek(s.ovulasi) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="mt-3">
          <ShareButton
            :tool-id="SLUG"
            :state="form"
            title="Perkiraan masa subur"
          />
        </div>
      </section>
    </template>
    <HealthLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
