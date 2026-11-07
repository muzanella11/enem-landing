<script setup lang="ts">
import {
  formatPustaka,
  keHtml,
  keTeks,
  urutkan,
  type GayaPustaka,
  type JenisSumber,
  type Sumber,
} from '~/utils/teks/pustaka';

const SLUG = 'buat-daftar-pustaka';
const KEY = 'elt_pustaka_v1';
const events = useToolEvents(SLUG);
const gaya = ref<GayaPustaka>('apa');
const daftar = ref<Sumber[]>([]);
const simpan = ref(false);
const kosong = (jenis: JenisSumber): Sumber & { penulisTeks: string } => ({
  jenis,
  penulis: [],
  penulisTeks: '',
  tahun: '',
  judul: '',
});
const form = reactive(kosong('buku'));
const disalin = ref(false);

onMounted(() => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as {
      daftar?: Sumber[];
      gaya?: GayaPustaka;
    } | null;
    if (raw?.daftar) {
      daftar.value = raw.daftar;
      gaya.value = raw.gaya ?? 'apa';
      simpan.value = true;
    }
  } catch {
    // Broken storage: start empty.
  }
});
watch(
  [daftar, gaya, simpan],
  () => {
    try {
      if (simpan.value)
        localStorage.setItem(
          KEY,
          JSON.stringify({ daftar: daftar.value, gaya: gaya.value }),
        );
      else localStorage.removeItem(KEY);
    } catch {
      // Storage blocked: the list still works for this visit.
    }
  },
  { deep: true },
);

const sumberForm = computed<Sumber>(() => ({
  ...form,
  penulis: form.penulisTeks
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean),
}));
const pratinjau = computed(() =>
  keHtml(formatPustaka(sumberForm.value, gaya.value)),
);
const terurut = computed(() => urutkan(daftar.value, gaya.value));
const tambah = () => {
  if (!form.judul.trim()) return;
  const { penulisTeks: _, ...rest } = { ...form };
  daftar.value.push({ ...rest, penulis: sumberForm.value.penulis });
  Object.assign(form, kosong(form.jenis));
  events.calculate(`${gaya.value}-${form.jenis}`);
};
const salin = async () => {
  const html = terurut.value
    .map(
      (s) =>
        `<p style="padding-left:1.27cm;text-indent:-1.27cm">${keHtml(formatPustaka(s, gaya.value))}</p>`,
    )
    .join('');
  const text = terurut.value
    .map((s) => keTeks(formatPustaka(s, gaya.value)))
    .join('\n');
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      }),
    ]);
  } catch {
    await navigator.clipboard.writeText(text);
  }
  disalin.value = true;
  setTimeout(() => (disalin.value = false), 2000);
  events.download(gaya.value);
};
const KOLOM: Record<JenisSumber, [keyof Sumber, string][]> = {
  buku: [
    ['edisi', 'Edisi (mis. Ed. ke-2)'],
    ['kota', 'Kota terbit'],
    ['penerbit', 'Penerbit'],
    ['doi', 'DOI (opsional)'],
  ],
  jurnal: [
    ['jurnal', 'Nama jurnal'],
    ['volume', 'Volume'],
    ['nomor', 'Nomor'],
    ['halaman', 'Halaman (mis. 101-115)'],
    ['doi', 'DOI'],
    ['url', 'URL (bila tidak ada DOI)'],
  ],
  web: [
    ['situs', 'Nama situs'],
    ['url', 'URL'],
    ['tanggalTerbit', 'Tanggal terbit (YYYY-MM-DD)'],
    ['diakses', 'Tanggal diakses (YYYY-MM-DD)'],
  ],
  skripsi: [
    ['institusi', 'Universitas'],
    ['url', 'URL repositori (opsional)'],
  ],
};
const faqs = [
  {
    q: 'Apa beda APA dan Harvard?',
    a: 'Keduanya memakai nama penulis dan tahun. APA edisi 7 menaruh tahun dalam kurung setelah titik dan memakai "&" antarpenulis; Harvard menaruh tahun tanpa titik dan memakai "dan". Ikuti pedoman kampus Anda.',
  },
  {
    q: 'Bagaimana menulis sumber tanpa tahun?',
    a: 'Pakai t.t. (tanpa tahun), padanan n.d. dalam pedoman berbahasa Indonesia.',
  },
  {
    q: 'Bagaimana penulis lembaga seperti BPS?',
    a: 'Centang "Penulis adalah lembaga" agar nama ditulis utuh tanpa inisial.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Buat Daftar Pustaka"
    seo-title="Buat Daftar Pustaka APA 7 dan Harvard Otomatis"
    description="Generator daftar pustaka APA edisi 7 dan Harvard untuk buku, jurnal, situs web, dan skripsi, dengan penulisan Indonesia (dkk., t.t.). Urut alfabetis dan salin dengan format miring."
    :faqs="faqs"
    application-category="EducationalApplication"
    :sources="[
      {
        label: 'APA Style: Reference examples (edisi 7)',
        url: 'https://apastyle.apa.org/style-grammar-guidelines/references/examples',
      },
      {
        label: 'Cite Them Right: Harvard',
        url: 'https://www.citethemrightonline.com/',
      },
    ]"
    checked-at="2026-11-06"
    wide
  >
    <section class="card space-y-3">
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label for="pus-gaya" class="field-label">Gaya</label>
          <select id="pus-gaya" v-model="gaya" class="field-input">
            <option value="apa">APA edisi 7</option>
            <option value="harvard">Harvard</option>
          </select>
        </div>
        <div>
          <label for="pus-jenis" class="field-label">Jenis sumber</label>
          <select id="pus-jenis" v-model="form.jenis" class="field-input">
            <option value="buku">Buku</option>
            <option value="jurnal">Artikel jurnal</option>
            <option value="web">Situs web</option>
            <option value="skripsi">Skripsi/tesis</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label for="pus-penulis" class="field-label"
            >Penulis (satu per baris)</label
          >
          <textarea
            id="pus-penulis"
            v-model="form.penulisTeks"
            rows="2"
            class="field-input"
            placeholder="Rina Kartika Sari"
          />
          <label class="mt-1 flex items-center gap-2 text-sm"
            ><input v-model="form.lembaga" type="checkbox" /> Penulis adalah
            lembaga</label
          >
        </div>
        <div>
          <label for="pus-tahun" class="field-label">Tahun</label
          ><input
            id="pus-tahun"
            v-model="form.tahun"
            class="field-input"
            placeholder="kosong = t.t."
          />
        </div>
        <div>
          <label for="pus-judul" class="field-label">Judul</label
          ><input id="pus-judul" v-model="form.judul" class="field-input" />
        </div>
        <div v-if="form.jenis === 'skripsi'">
          <label for="pus-jenjang" class="field-label">Jenis</label>
          <select id="pus-jenjang" v-model="form.jenjang" class="field-input">
            <option value="Skripsi">Skripsi</option>
            <option value="Tesis">Tesis</option>
            <option value="Disertasi">Disertasi</option>
          </select>
        </div>
        <div v-for="[key, label] in KOLOM[form.jenis]" :key="key">
          <label :for="`pus-${key}`" class="field-label">{{ label }}</label>
          <input
            :id="`pus-${key}`"
            v-model="form[key as 'url']"
            class="field-input"
          />
        </div>
      </div>
      <p class="text-sm text-slate-600">Pratinjau:</p>
      <!-- eslint-disable-next-line vue/no-v-html -- escaped by keHtml -->
      <p class="font-serif" v-html="pratinjau" />
      <button type="button" class="btn-primary" @click="tambah">
        Tambah ke daftar
      </button>
    </section>
    <section v-if="daftar.length" class="card space-y-3" aria-live="polite">
      <h2 class="font-semibold">Daftar Pustaka ({{ daftar.length }})</h2>
      <!-- eslint-disable vue/no-v-html -- escaped by keHtml -->
      <p
        v-for="(s, i) in terurut"
        :key="i"
        class="pl-8 -indent-8 font-serif"
        v-html="keHtml(formatPustaka(s, gaya))"
      />
      <!-- eslint-enable vue/no-v-html -->
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-primary" @click="salin">
          {{ disalin ? 'Tersalin' : 'Salin semua' }}
        </button>
        <button
          type="button"
          class="text-sm text-rose-700"
          @click="daftar = []"
        >
          Kosongkan daftar
        </button>
      </div>
      <label class="flex items-center gap-2 text-sm"
        ><input v-model="simpan" type="checkbox" /> Simpan daftar di browser
        ini</label
      >
    </section>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/penghitung-kata" class="btn-link">Penghitung kata</NuxtLink
      ><NuxtLink to="/buat-surat" class="btn-link">Buat surat</NuxtLink>
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
