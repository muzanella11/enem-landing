<script setup lang="ts">
import { bytesToBlob, downloadBlob } from '~/utils/browser-files';
import { formatBytes } from '~/utils/files';

const SLUG = 'gabung-pdf';
const events = useToolEvents(SLUG);
const { files, add, remove, move, overSoftLimit } = useFileList();
const busy = ref(false);
const error = ref('');
const output = ref<Blob | null>(null);

onMounted(() => usePdfWorker().warmUp());
watch(files, () => (output.value = null), { deep: true });

const merge = async () => {
  busy.value = true;
  error.value = '';
  events.calculate();
  try {
    const buffers = await Promise.all(
      files.value.map((item) => item.file.arrayBuffer()),
    );
    const bytes = await usePdfWorker().call<Uint8Array>(
      'merge',
      { files: buffers },
      buffers,
    );
    output.value = bytesToBlob(bytes, 'application/pdf');
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'Gagal menggabungkan PDF.';
  } finally {
    busy.value = false;
  }
};

const download = () => {
  if (!output.value) return;
  downloadBlob(output.value, 'gabungan.pdf');
  events.download('pdf');
};

const faqs = [
  {
    q: 'Apakah file PDF saya di-upload?',
    a: 'Tidak. Penggabungan dilakukan di browsermu dengan pdf-lib. File tidak pernah meninggalkan perangkatmu, dan tool tetap jalan walau internet terputus setelah halaman terbuka.',
  },
  {
    q: 'Berapa banyak file yang bisa digabung?',
    a: 'Tidak ada batas jumlah. Batas praktisnya adalah memori perangkatmu; kami memberi peringatan bila total ukuran terlalu besar.',
  },
  {
    q: 'Bisakah menggabungkan PDF yang dikunci kata sandi?',
    a: 'Belum. Buka kunci PDF terlebih dahulu, lalu gabungkan.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Gabung PDF"
    seo-title="Gabung PDF Online Tanpa Upload"
    description="Gabungkan beberapa file PDF jadi satu langsung di browser. Atur urutannya, lalu unduh. File tidak pernah di-upload."
    application-category="UtilitiesApplication"
    :faqs="faqs"
  >
    <FileDropzone
      accept="application/pdf,.pdf"
      label="Pilih file PDF yang mau digabung"
      @files="add"
    />
    <div v-if="files.length > 0" class="space-y-4">
      <p class="text-sm text-slate-600">
        Seret atau pakai tombol panah untuk mengatur urutan.
      </p>
      <FileList :files="files" reorderable @remove="remove" @move="move" />
      <p
        v-if="overSoftLimit"
        class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
      >
        Total file cukup besar untuk perangkat ini. Proses mungkin lambat atau
        gagal; coba bagi jadi beberapa kali.
      </p>
      <button
        type="button"
        class="btn-primary"
        :disabled="files.length < 2 || busy"
        @click="merge"
      >
        Gabungkan {{ files.length }} PDF
      </button>
      <p v-if="error" class="text-sm text-rose-700">{{ error }}</p>
    </div>
    <BusyPanel v-if="busy" message="Menggabungkan PDF" :slug="SLUG" />
    <section v-if="output && !busy" class="card space-y-4">
      <p class="font-semibold">
        PDF gabungan siap ({{ formatBytes(output.size) }}).
      </p>
      <button type="button" class="btn-primary" @click="download">
        Unduh gabungan.pdf
      </button>
      <DonationCta placement="after-download" :slug="SLUG" />
      <AdSlot placement="result" :slug="SLUG" />
    </section>
  </ToolShell>
</template>
