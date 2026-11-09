<script setup lang="ts">
import { PAS_FOTO_CM, pasFotoPixels, type PasFotoSize } from '~/utils/files';
import { sameFormatAs } from '~/composables/use-image-batch';

const SLUG = 'ubah-ukuran-gambar';
const { files, add, remove, move } = useFileList();
const batch = useImageBatch(SLUG);

const mode = ref<'piksel' | 'persen' | 'pasfoto'>('piksel');
const width = ref(1280);
const height = ref(1280);
const percent = ref(50);
const pasFoto = ref<PasFotoSize>('3x4');

const resize = () =>
  batch.run(
    files.value,
    (file) => {
      if (mode.value === 'pasfoto') {
        return {
          format: 'image/jpeg',
          quality: 0.92,
          exact: pasFotoPixels(pasFoto.value),
        };
      }
      if (mode.value === 'persen') {
        return {
          format: sameFormatAs(file),
          quality: 0.9,
          scale: percent.value / 100,
        };
      }
      return {
        format: sameFormatAs(file),
        quality: 0.9,
        maxWidth: width.value || undefined,
        maxHeight: height.value || undefined,
      };
    },
    mode.value,
  );

const faqs = [
  {
    q: 'Berapa ukuran piksel pas foto 3x4?',
    a: 'Pada resolusi cetak 300 dpi, pas foto 3x4 cm adalah 354 x 472 piksel. Tool ini memotong bagian tengah foto agar rasionya pas, lalu mengubah ukurannya.',
  },
  {
    q: 'Apakah foto akan melar?',
    a: 'Tidak. Mode piksel menjaga perbandingan sisi (foto dimuat di dalam kotak lebar x tinggi), dan mode pas foto memotong tengah foto alih-alih menariknya.',
  },
];

const howTo = [
  'Pilih foto yang ingin diubah ukurannya.',
  'Pilih mode piksel, persen, atau pas foto (2x3, 3x4, 4x6).',
  "Tekan 'Ubah ukuran' lalu unduh hasilnya.",
];
</script>

<template>
  <ToolShell
    :how-to="howTo"
    :slug="SLUG"
    title="Ubah Ukuran Gambar"
    seo-title="Ubah Ukuran Foto dan Buat Pas Foto 3x4 Online"
    description="Resize foto berdasarkan piksel atau persen, atau buat pas foto 2x3, 3x4, dan 4x6 siap cetak. Diproses di browser tanpa upload."
    application-category="MultimediaApplication"
    :faqs="faqs"
  >
    <FileDropzone
      accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp,.avif"
      label="Pilih foto"
      @files="add"
    />
    <form
      v-if="files.length > 0"
      class="card space-y-4"
      @submit.prevent="resize"
    >
      <FileList :files="files" @remove="remove" @move="move" />
      <div class="seg" role="group" aria-label="Mode ukuran">
        <button
          type="button"
          :aria-pressed="mode === 'piksel'"
          @click="mode = 'piksel'"
        >
          Piksel
        </button>
        <button
          type="button"
          :aria-pressed="mode === 'persen'"
          @click="mode = 'persen'"
        >
          Persen
        </button>
        <button
          type="button"
          :aria-pressed="mode === 'pasfoto'"
          @click="mode = 'pasfoto'"
        >
          Pas foto
        </button>
      </div>
      <div v-if="mode === 'piksel'" class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="lebar" class="field-label">Lebar maksimal (px)</label>
          <input
            id="lebar"
            v-model.number="width"
            type="number"
            min="1"
            class="field-input"
          />
        </div>
        <div>
          <label for="tinggi" class="field-label">Tinggi maksimal (px)</label>
          <input
            id="tinggi"
            v-model.number="height"
            type="number"
            min="1"
            class="field-input"
          />
        </div>
        <p class="field-hint sm:col-span-2">
          Perbandingan sisi tetap; foto tidak pernah diperbesar.
        </p>
      </div>
      <div v-else-if="mode === 'persen'">
        <label for="persen" class="field-label"
          >Ukuran baru: {{ percent }}%</label
        >
        <input
          id="persen"
          v-model.number="percent"
          type="range"
          min="5"
          max="100"
          step="5"
          class="w-full accent-primary"
        />
      </div>
      <div v-else>
        <label for="pasfoto" class="field-label">Ukuran pas foto</label>
        <select id="pasfoto" v-model="pasFoto" class="field-input">
          <option v-for="(size, key) in PAS_FOTO_CM" :key="key" :value="key">
            {{ key }} cm ({{ pasFotoPixels(key).width }} x
            {{ pasFotoPixels(key).height }} px, 300 dpi)
          </option>
        </select>
        <p class="field-hint">
          Bagian tengah foto dipotong agar rasionya pas. Pakai foto dengan wajah
          di tengah.
        </p>
      </div>
      <button type="submit" class="btn-primary" :disabled="batch.busy.value">
        Ubah ukuran
      </button>
    </form>
    <BusyPanel
      v-if="batch.busy.value"
      message="Mengubah ukuran"
      :progress="batch.progress.value"
      :slug="SLUG"
    />
    <ImageResults
      v-else-if="
        batch.results.value.length > 0 || batch.failures.value.length > 0
      "
      :slug="SLUG"
      :results="batch.results.value"
      :failures="batch.failures.value"
      zip-name="foto-diubah-ukuran.zip"
      @one="batch.downloadOne"
      @all="batch.downloadAll('foto-diubah-ukuran.zip')"
    />
  </ToolShell>
</template>
