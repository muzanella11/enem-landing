<script setup lang="ts">
import { SKALA_NILAI } from '~/data/ipk';
import { downloadBlob } from '~/utils/browser-files';
import {
  hitungIpk,
  hitungIps,
  ipsDibutuhkan,
  type Semester,
} from '~/utils/akademik';
import { IPK_STORAGE_KEY, parseIpkStore } from '~/utils/akademik/storage';

const SLUG = 'kalkulator-ipk';
const events = useToolEvents(SLUG);
const kosong = (): Semester => ({
  nama: 'Semester 1',
  matkul: [{ nama: '', sks: 3, bobot: null }],
});
const skala = ref('ab');
const semesters = ref<Semester[]>([kosong()]);
const loaded = ref(false);
const target = ref(3.5);
const sksDepan = ref(20);
const importError = ref('');

onMounted(() => {
  try {
    const stored = parseIpkStore(
      JSON.parse(localStorage.getItem(IPK_STORAGE_KEY) ?? 'null'),
    );
    if (stored && stored.semesters.length) {
      skala.value = stored.skala;
      semesters.value = stored.semesters;
    }
  } catch {
    // Ignore broken storage.
  }
  loaded.value = true;
});
watch(
  [skala, semesters],
  () => {
    if (!loaded.value) return;
    try {
      localStorage.setItem(
        IPK_STORAGE_KEY,
        JSON.stringify({ skala: skala.value, semesters: semesters.value }),
      );
    } catch {
      // Storage full or blocked: the page still works.
    }
  },
  { deep: true },
);

const daftarNilai = computed(
  () => SKALA_NILAI.find((s) => s.id === skala.value)?.nilai ?? [],
);
const ipk = computed(() => hitungIpk(semesters.value));
const perlu = computed(() =>
  ipsDibutuhkan(
    ipk.value.sks,
    ipk.value.mutu,
    Number(sksDepan.value),
    Number(target.value),
  ),
);
let dicatat = false;
watch(ipk, (value) => {
  if (value.sks > 0 && !dicatat) {
    dicatat = true;
    events.calculate(skala.value);
  }
});

const tambahSemester = () =>
  semesters.value.push({
    nama: `Semester ${semesters.value.length + 1}`,
    matkul: [{ nama: '', sks: 3, bobot: null }],
  });
const tambahMatkul = (semester: Semester) =>
  semester.matkul.push({ nama: '', sks: 3, bobot: null });
const hapusSemua = () => {
  localStorage.removeItem(IPK_STORAGE_KEY);
  loaded.value = false;
  semesters.value = [kosong()];
  nextTick(() => (loaded.value = true));
};
const ekspor = () => {
  downloadBlob(
    new Blob(
      [
        JSON.stringify(
          { skala: skala.value, semesters: semesters.value },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    ),
    'riwayat-ipk.json',
  );
  events.download('json');
};
const impor = async (files: File[]) => {
  importError.value = '';
  try {
    const parsed = parseIpkStore(JSON.parse(await files[0]!.text()));
    if (!parsed) throw new Error('format');
    skala.value = parsed.skala;
    semesters.value = parsed.semesters;
  } catch {
    importError.value = 'File bukan cadangan IPK yang valid.';
  }
};
const angka = (n: number) =>
  n.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const faqs = [
  {
    q: 'Bagaimana cara menghitung IPK?',
    a: 'Kalikan bobot nilai tiap mata kuliah dengan SKS-nya, jumlahkan, lalu bagi dengan total SKS. IPS memakai mata kuliah satu semester, IPK memakai semua semester.',
  },
  {
    q: 'Bagaimana jika mata kuliah diulang?',
    a: 'Tulis nama mata kuliah yang sama di semester ulangannya. Kalkulator hanya menghitung nilai terbaik, seperti aturan di sebagian besar kampus.',
  },
  {
    q: 'Berapa IPK untuk cumlaude?',
    a: 'Umumnya IPK di atas 3,50 untuk sarjana, sering dengan syarat tambahan seperti lulus tepat waktu dan tanpa nilai ulang. Cek pedoman akademik kampus Anda.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator IPK"
    seo-title="Kalkulator IPK dan IPS Online, Bisa Simulasi Target IPK"
    description="Hitung IPS per semester dan IPK kumulatif dengan skala nilai kampus Anda, mata kuliah ulang dihitung nilai terbaik, plus simulasi target IPK."
    application-category="EducationalApplication"
    :faqs="faqs"
    :how-to="[
      'Pilih skala nilai kampus Anda.',
      'Isi mata kuliah, SKS, dan nilai per semester.',
      'Lihat IPS, IPK, predikat, dan nilai yang dibutuhkan untuk target IPK.',
    ]"
    :caveats="[
      'Predikat dan aturan nilai ulang mengikuti aturan umum; pedoman akademik kampus Anda yang berlaku.',
    ]"
    checked-at="2026-11-06"
    wide
  >
    <section class="card flex flex-wrap items-end gap-3">
      <div>
        <label for="ipk-skala" class="field-label">Skala nilai</label>
        <select id="ipk-skala" v-model="skala" class="field-input">
          <option v-for="s in SKALA_NILAI" :key="s.id" :value="s.id">
            {{ s.label }}
          </option>
          <option value="angka">Isi bobot angka sendiri (0-4)</option>
        </select>
      </div>
      <button type="button" class="btn-secondary" @click="ekspor">
        Ekspor JSON
      </button>
      <FileDropzone
        accept="application/json,.json"
        :multiple="false"
        label="Impor JSON"
        @files="impor"
      />
    </section>
    <p v-if="importError" class="text-sm text-rose-700">{{ importError }}</p>

    <section
      v-for="(semester, si) in semesters"
      :key="si"
      class="card space-y-2"
    >
      <div class="flex items-center gap-3">
        <input
          v-model="semester.nama"
          :aria-label="`Nama semester ${si + 1}`"
          class="field-input max-w-xs font-semibold"
        />
        <span class="tabular text-sm text-slate-600"
          >IPS {{ angka(hitungIps(semester).ip) }} ({{
            hitungIps(semester).sks
          }}
          SKS)</span
        >
      </div>
      <div
        v-for="(mk, mi) in semester.matkul"
        :key="mi"
        class="grid grid-cols-[1fr_4.5rem_6rem_2rem] gap-2"
      >
        <input
          v-model="mk.nama"
          :aria-label="`Mata kuliah ${mi + 1} ${semester.nama}`"
          placeholder="Mata kuliah"
          class="field-input"
        />
        <input
          v-model.number="mk.sks"
          type="number"
          min="0"
          max="24"
          :aria-label="`SKS ${mi + 1} ${semester.nama}`"
          class="field-input"
        />
        <input
          v-if="skala === 'angka'"
          v-model.number="mk.bobot"
          type="number"
          min="0"
          max="4"
          step="0.01"
          :aria-label="`Nilai ${mi + 1} ${semester.nama}`"
          class="field-input"
        />
        <select
          v-else
          v-model="mk.bobot"
          :aria-label="`Nilai ${mi + 1} ${semester.nama}`"
          class="field-input"
        >
          <option :value="null">-</option>
          <option v-for="n in daftarNilai" :key="n.huruf" :value="n.bobot">
            {{ n.huruf }}
          </option>
        </select>
        <button
          type="button"
          class="btn-remove"
          :aria-label="`Hapus mata kuliah ${mi + 1}`"
          @click="semester.matkul.splice(mi, 1)"
        >
          ✕
        </button>
      </div>
      <button type="button" class="btn-link" @click="tambahMatkul(semester)">
        + Mata kuliah
      </button>
    </section>
    <div class="flex flex-wrap gap-3">
      <button type="button" class="btn-secondary" @click="tambahSemester">
        + Semester
      </button>
      <button type="button" class="text-sm text-rose-700" @click="hapusSemua">
        Hapus data tersimpan
      </button>
    </div>
    <p class="text-xs text-slate-500">
      Riwayat nilai disimpan di browser ini saja, tidak dikirim ke server.
    </p>

    <section class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">IPK kumulatif ({{ ipk.sks }} SKS)</p>
      <p class="tabular text-3xl font-bold text-primary">
        {{ angka(ipk.ip) }}
      </p>
      <p v-if="ipk.predikat">
        Predikat: <strong>{{ ipk.predikat }}</strong>
      </p>
      <div class="grid gap-2 pt-2 sm:grid-cols-2">
        <div>
          <label for="ipk-target" class="field-label">Target IPK</label>
          <input
            id="ipk-target"
            v-model.number="target"
            type="number"
            min="0"
            max="4"
            step="0.01"
            class="field-input"
          />
        </div>
        <div>
          <label for="ipk-sks-depan" class="field-label"
            >SKS semester depan</label
          >
          <input
            id="ipk-sks-depan"
            v-model.number="sksDepan"
            type="number"
            min="1"
            max="24"
            class="field-input"
          />
        </div>
      </div>
      <p v-if="perlu !== null">
        Butuh IPS minimal <strong>{{ angka(perlu) }}</strong> semester depan.
      </p>
      <p v-else class="text-amber-800">
        Target ini tidak bisa dicapai dalam satu semester dengan
        {{ sksDepan }} SKS.
      </p>
    </section>
    <NuxtLink to="/simulasi-nilai-skd" class="btn-link"
      >Simulasi nilai SKD CPNS</NuxtLink
    >
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
