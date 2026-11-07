<script setup lang="ts">
import type { SuratTemplate } from '~/data/surat';
import type { PaperSize } from '~/utils/files';
import { bytesToBlob, downloadBlob } from '~/utils/browser-files';
import {
  kolomAktif,
  kolomKosong,
  susunSurat,
  suratKeTeks,
  type Nilai,
} from '~/utils/surat';
import { loadSurat, saveSurat, SURAT_STORAGE_KEY } from '~/utils/surat/storage';

/** Form + live preview + PDF/text output for one letter type (Story 33). */
const props = defineProps<{ template: SuratTemplate }>();
const events = useToolEvents('buat-surat');

const nilai = ref<Nilai>({});
const loaded = ref(false);
const saveError = ref('');
const meterai = ref(props.template.meterai?.bawaan ?? false);
const kertas = ref<PaperSize>('A4');
const disalin = ref(false);

onMounted(() => {
  nilai.value = loadSurat(localStorage);
  if (!nilai.value['tanggal'])
    nilai.value['tanggal'] = new Date().toLocaleDateString('sv-SE');
  for (const kolom of props.template.kolom) {
    if (kolom.jenis === 'pilihan' && !nilai.value[kolom.id] && kolom.wajib)
      nilai.value[kolom.id] = kolom.pilihan?.[0]?.value ?? '';
  }
  loaded.value = true;
});
watch(
  nilai,
  (value) => {
    if (!loaded.value) return;
    try {
      saveSurat(localStorage, value);
      saveError.value = '';
    } catch {
      saveError.value = 'Penyimpanan browser penuh atau diblokir.';
    }
  },
  { deep: true },
);
const hapusData = () => {
  localStorage.removeItem(SURAT_STORAGE_KEY);
  loaded.value = false;
  nilai.value = { tanggal: new Date().toLocaleDateString('sv-SE') };
  nextTick(() => (loaded.value = true));
};

const kolom = computed(() => kolomAktif(props.template, nilai.value));
const kosong = computed(() => kolomKosong(props.template, nilai.value));
const peringatan = computed(
  () => props.template.peringatan?.(nilai.value) ?? [],
);
const surat = computed(() =>
  susunSurat(props.template, nilai.value, { meterai: meterai.value }),
);

const unduh = async () => {
  const { renderSuratPdf } = await import('~/utils/surat/pdf');
  const bytes = await renderSuratPdf(surat.value, kertas.value);
  const nama = (nilai.value['nama'] ?? '').trim().replace(/[^\w-]+/g, '-');
  downloadBlob(
    bytesToBlob(bytes, 'application/pdf'),
    `${props.template.slug}${nama ? `-${nama}` : ''}.pdf`,
  );
  events.download(`pdf-${props.template.slug}`);
};
const salin = async () => {
  await navigator.clipboard.writeText(suratKeTeks(surat.value));
  disalin.value = true;
  setTimeout(() => (disalin.value = false), 2000);
  events.download(`teks-${props.template.slug}`);
};
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[22rem_1fr]">
    <section class="card space-y-3">
      <div v-for="item in kolom" :key="item.id" class="space-y-1">
        <label :for="`surat-${item.id}`" class="field-label"
          >{{ item.label
          }}<span v-if="item.wajib" class="text-rose-700"> *</span></label
        >
        <textarea
          v-if="item.jenis === 'panjang'"
          :id="`surat-${item.id}`"
          v-model="nilai[item.id]"
          rows="3"
          class="field-input"
          :placeholder="item.placeholder ?? item.contoh"
        />
        <select
          v-else-if="item.jenis === 'pilihan'"
          :id="`surat-${item.id}`"
          v-model="nilai[item.id]"
          class="field-input"
        >
          <option v-if="!item.wajib" value="">-</option>
          <option v-for="o in item.pilihan" :key="o.value" :value="o.value">
            {{ o.label }}
          </option>
        </select>
        <input
          v-else
          :id="`surat-${item.id}`"
          v-model="nilai[item.id]"
          :type="item.jenis === 'tanggal' ? 'date' : 'text'"
          class="field-input"
          :placeholder="item.placeholder ?? item.contoh"
        />
        <p v-if="item.bantuan" class="text-xs text-slate-500">
          {{ item.bantuan }}
        </p>
      </div>
      <label v-if="template.meterai" class="flex items-start gap-2 text-sm">
        <input v-model="meterai" type="checkbox" class="mt-1" />
        <span>Beri kotak meterai. {{ template.meterai.catatan }}</span>
      </label>
      <p class="text-xs text-slate-500">
        Isian disimpan di browser ini saja agar bisa dipakai lagi untuk surat
        lain.
        <button type="button" class="btn-link text-xs" @click="hapusData">
          Hapus data tersimpan
        </button>
      </p>
      <p v-if="saveError" class="text-xs text-rose-700">{{ saveError }}</p>
    </section>
    <section class="space-y-4">
      <div class="card flex flex-wrap items-center gap-3">
        <label for="surat-kertas" class="field-label">Kertas</label>
        <select id="surat-kertas" v-model="kertas" class="field-input w-auto">
          <option value="A4">A4</option>
          <option value="F4">F4/Folio</option>
        </select>
        <button type="button" class="btn-primary" @click="unduh">
          Unduh PDF
        </button>
        <button type="button" class="btn-secondary" @click="salin">
          {{ disalin ? 'Tersalin' : 'Salin teks' }}
        </button>
      </div>
      <div
        v-if="kosong.length || peringatan.length"
        class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
        aria-live="polite"
      >
        <p v-if="kosong.length">
          Belum diisi: {{ kosong.map((k) => k.label).join(', ') }}.
        </p>
        <p v-for="item in peringatan" :key="item">{{ item }}</p>
      </div>
      <SuratPreview :surat="surat" />
    </section>
  </div>
</template>
