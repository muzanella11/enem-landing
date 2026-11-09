<script setup lang="ts">
import { ATURAN_SKD_TERBARU as ATURAN } from '~/data/cpns/skd';
import { cekSkd, skorDariJawaban, skorMaksimum } from '~/utils/akademik';

const SLUG = 'simulasi-nilai-skd';
const events = useToolEvents(SLUG);
const max = skorMaksimum(ATURAN);
const form = reactive({
  formasi: 'umum',
  twk: null as number | null,
  tiu: null as number | null,
  tkp: null as number | null,
});
const hasil = ref<ReturnType<typeof cekSkd> | null>(null);
const skor = ref<ReturnType<typeof skorDariJawaban> | null>(null);

onMounted(() => {
  const shared = useSharedState<typeof form>(SLUG);
  if (shared) {
    Object.assign(form, shared);
    hitung();
  }
});
const batas = (n: unknown, maks: number) =>
  Math.max(0, Math.min(maks, Math.round(Number(n) || 0)));
const hitung = () => {
  const formasi = ATURAN.formasi.find((f) => f.id === form.formasi)!;
  skor.value = skorDariJawaban(
    batas(form.twk, ATURAN.soal.twk),
    batas(form.tiu, ATURAN.soal.tiu),
    batas(form.tkp, max.tkp),
  );
  hasil.value = cekSkd(skor.value, formasi);
  events.calculate(form.formasi);
};
const syarat = (f: (typeof ATURAN.formasi)[number]) =>
  [
    f.twk !== null && `TWK ${f.twk}`,
    f.tiu !== null && `TIU ${f.tiu}`,
    f.tkp !== null && `TKP ${f.tkp}`,
    f.totalMin !== null && `total ${f.totalMin}`,
  ]
    .filter(Boolean)
    .join(', ');
const faqs = [
  {
    q: 'Berapa passing grade SKD CPNS?',
    a: `Pada seleksi ${ATURAN.tahun} (${ATURAN.dasarHukum}), formasi umum harus mencapai TWK 65, TIU 80, dan TKP 166. Formasi cumlaude dan diaspora memakai total minimal 311 dengan TIU minimal 85; disabilitas, putra/putri Papua, dan daerah tertinggal memakai total minimal 286 dengan TIU minimal 60.`,
  },
  {
    q: 'Bagaimana skor SKD dihitung?',
    a: `TWK (${ATURAN.soal.twk} soal) dan TIU (${ATURAN.soal.tiu} soal): benar 5, salah atau kosong 0. TKP (${ATURAN.soal.tkp} soal): setiap jawaban bernilai 1 sampai 5. Skor maksimal ${max.twk + max.tiu + max.tkp}.`,
  },
  {
    q: 'Kalau lolos ambang batas, pasti lanjut ke SKB?',
    a: 'Belum tentu. Peserta juga harus masuk peringkat sampai tiga kali jumlah formasi yang dibutuhkan, mis. 3 formasi berarti peringkat 1 sampai 9.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Simulasi Nilai SKD CPNS"
    seo-title="Simulasi Nilai SKD CPNS dan Cek Passing Grade TWK, TIU, TKP"
    description="Hitung skor TWK, TIU, dan TKP lalu cek terhadap nilai ambang batas SKD CPNS per formasi: umum, cumlaude, diaspora, disabilitas, Papua, dan daerah tertinggal."
    application-category="EducationalApplication"
    :faqs="faqs"
    :how-to="[
      'Pilih formasi.',
      'Isi jumlah jawaban benar TWK dan TIU serta total skor TKP.',
      'Tekan Cek nilai untuk melihat lulus/tidak per subtes dan selisihnya.',
    ]"
    :sources="ATURAN.sources"
    :checked-at="ATURAN.checkedAt"
    :caveats="[
      `Memakai aturan seleksi CPNS ${ATURAN.tahun} (${ATURAN.dasarHukum}). Aturan seleksi berikutnya akan diperbarui setelah KepmenPANRB-nya terbit.`,
    ]"
  >
    <p class="rounded-lg bg-sky-50 p-3 text-sm text-sky-900">
      Aturan yang dipakai: <strong>seleksi CPNS {{ ATURAN.tahun }}</strong
      >, {{ ATURAN.dasarHukum }}.
    </p>
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <div class="sm:col-span-2">
        <label for="skd-formasi" class="field-label">Formasi</label>
        <select id="skd-formasi" v-model="form.formasi" class="field-input">
          <option v-for="f in ATURAN.formasi" :key="f.id" :value="f.id">
            {{ f.label }} ({{ syarat(f) }})
          </option>
        </select>
      </div>
      <div>
        <label for="skd-twk" class="field-label"
          >Benar TWK (dari {{ ATURAN.soal.twk }})</label
        >
        <input
          id="skd-twk"
          v-model.number="form.twk"
          type="number"
          min="0"
          :max="ATURAN.soal.twk"
          class="field-input"
        />
      </div>
      <div>
        <label for="skd-tiu" class="field-label"
          >Benar TIU (dari {{ ATURAN.soal.tiu }})</label
        >
        <input
          id="skd-tiu"
          v-model.number="form.tiu"
          type="number"
          min="0"
          :max="ATURAN.soal.tiu"
          class="field-input"
        />
      </div>
      <div>
        <label for="skd-tkp" class="field-label"
          >Skor TKP (maks {{ max.tkp }})</label
        >
        <input
          id="skd-tkp"
          v-model.number="form.tkp"
          type="number"
          min="0"
          :max="max.tkp"
          class="field-input"
        />
      </div>
      <button type="submit" class="btn-primary sm:col-span-2">Cek nilai</button>
    </form>
    <section v-if="hasil && skor" class="card space-y-3" aria-live="polite">
      <p
        class="text-3xl font-bold"
        :class="hasil.lulus ? 'text-primary' : 'text-rose-800'"
      >
        {{
          hasil.lulus ? 'Memenuhi ambang batas' : 'Belum memenuhi ambang batas'
        }}
      </p>
      <p class="tabular">
        TWK {{ skor.twk }} · TIU {{ skor.tiu }} · TKP {{ skor.tkp }} · Total
        {{ hasil.total }}
      </p>
      <table class="tabular w-full text-sm">
        <tbody>
          <tr
            v-for="c in hasil.cek"
            :key="c.label"
            class="border-t border-slate-100"
          >
            <td class="py-2">{{ c.label }}</td>
            <td class="py-2 text-right">
              {{ c.skor }} / ambang {{ c.ambang }}
            </td>
            <td
              class="py-2 text-right font-semibold"
              :class="c.lulus ? 'text-primary' : 'text-rose-700'"
            >
              {{ c.selisih >= 0 ? `+${c.selisih}` : c.selisih }}
            </td>
          </tr>
        </tbody>
      </table>
      <ShareButton :tool-id="SLUG" :state="form" title="Simulasi nilai SKD" />
    </section>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/kompres-gambar" class="btn-link"
        >Kompres foto untuk berkas CPNS</NuxtLink
      >
      <NuxtLink to="/kalkulator-ipk" class="btn-link">Kalkulator IPK</NuxtLink>
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
