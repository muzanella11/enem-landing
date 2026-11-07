<script setup lang="ts">
import { LISENSI_MODEL, WARNA_LATAR } from '~/data/latar';
import { downloadBlob } from '~/utils/browser-files';

const SLUG = 'hapus-latar-foto';
const events = useToolEvents(SLUG);
const editor = ref<{ hasil: () => HTMLCanvasElement | null } | null>(null);
const pilihan = ref<string>('transparan');
const kustom = ref('#00A86B');
const siap = ref(false);
const latar = computed(() =>
  pilihan.value === 'transparan'
    ? null
    : pilihan.value === 'kustom'
      ? kustom.value
      : WARNA_LATAR.find((w) => w.id === pilihan.value)!.hex,
);
const unduh = async () => {
  const canvas = editor.value?.hasil();
  if (!canvas) return;
  const png = !latar.value;
  const blob = await new Promise<Blob | null>((r) =>
    canvas.toBlob(r, png ? 'image/png' : 'image/jpeg', 0.92),
  );
  if (!blob) return;
  downloadBlob(blob, png ? 'foto-tanpa-latar.png' : 'foto-latar-baru.jpg');
  events.download(png ? 'png' : 'jpg');
};
const faqs = [
  {
    q: 'Apakah foto saya diunggah?',
    a: 'Tidak. Model pemisah latar dimuat ke browser Anda dan foto diproses di perangkat ini saja.',
  },
  {
    q: 'Rambut terpotong atau latar masih tersisa?',
    a: 'Pakai Kuas hapus untuk membuang sisa latar dan Kuas kembalikan untuk bagian badan atau rambut yang ikut hilang.',
  },
  {
    q: 'Format apa yang dihasilkan?',
    a: 'PNG transparan bila latar dibuat transparan, atau JPG bila latar diganti warna.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Hapus Latar Foto"
    seo-title="Hapus Background Foto Online Tanpa Upload (Transparan atau Warna)"
    description="Hapus latar foto jadi transparan atau ganti warna merah, biru, putih, atau warna lain, langsung di browser. Foto tidak diunggah ke server."
    :faqs="faqs"
    application-category="MultimediaApplication"
    :sources="[LISENSI_MODEL]"
    checked-at="2026-11-06"
    wide
  >
    <LatarFoto ref="editor" :slug="SLUG" :latar="latar" @siap="siap = true" />
    <section v-if="siap" class="card space-y-3">
      <fieldset class="flex flex-wrap items-center gap-3 text-sm">
        <legend class="field-label">Latar</legend>
        <label
          ><input v-model="pilihan" type="radio" value="transparan" />
          Transparan</label
        >
        <label v-for="w in WARNA_LATAR" :key="w.id"
          ><input v-model="pilihan" type="radio" :value="w.id" />
          {{ w.label }}</label
        >
        <label class="flex items-center gap-1"
          ><input v-model="pilihan" type="radio" value="kustom" /> Lainnya
          <input v-model="kustom" type="color" aria-label="Warna latar kustom"
        /></label>
      </fieldset>
      <button type="button" class="btn-primary" @click="unduh">
        Unduh {{ latar ? 'JPG' : 'PNG' }}
      </button>
      <DonationCta placement="after-download" :slug="SLUG" />
    </section>
    <NuxtLink to="/pas-foto-latar-merah-biru" class="btn-link"
      >Buat pas foto latar merah/biru</NuxtLink
    >
  </ToolShell>
</template>
