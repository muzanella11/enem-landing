<script setup lang="ts">
import { linkWhatsApp, normalisasiNomor } from '~/utils/qr';

const SLUG = 'link-whatsapp';
const events = useToolEvents(SLUG);
const nomor = ref('');
const pesan = ref('Halo kak, saya mau tanya produknya.');
const link = computed(() =>
  nomor.value ? linkWhatsApp(nomor.value, pesan.value) : null,
);
const nomorValid = computed(
  () => !nomor.value || normalisasiNomor(nomor.value) !== null,
);
const copied = ref(false);
const TEMPLATES = [
  'Halo kak, saya mau tanya produknya.',
  'Halo, saya mau pesan:\n- \nAlamat kirim: ',
  'Halo, saya sudah transfer untuk invoice nomor ',
];
const salin = async () => {
  if (!link.value) return;
  await navigator.clipboard.writeText(link.value);
  copied.value = true;
  events.calculate('salin');
  setTimeout(() => (copied.value = false), 2000);
};
const faqs = [
  {
    q: 'Bagaimana cara membuat link WhatsApp?',
    a: 'Format resminya https://wa.me/ diikuti nomor dengan kode negara 62 tanpa angka 0 di depan, misalnya https://wa.me/6281234567890. Tool ini mengubah nomor 08... secara otomatis dan menambahkan pesan.',
  },
  {
    q: 'Apakah nomor saya disimpan?',
    a: 'Tidak. Link dibuat di browsermu dan langsung menuju wa.me, tanpa lewat server kami.',
  },
];
const howTo = [
  'Isi nomor WhatsApp (format 08... atau +62...).',
  'Tulis pesan otomatis, atau pilih template.',
  'Salin link, uji, atau unduh QR code-nya untuk dicetak.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Buat Link WhatsApp"
    seo-title="Buat Link WhatsApp (wa.me) dengan Pesan Otomatis dan QR"
    description="Buat link WhatsApp wa.me dengan pesan otomatis untuk toko online dan UMKM, lengkap dengan QR code yang bisa dicetak."
    application-category="BusinessApplication"
    :faqs="faqs"
    :how-to="howTo"
    checked-at="2026-11-06"
  >
    <section class="card space-y-4">
      <div>
        <label for="nomor-wa" class="field-label">Nomor WhatsApp</label>
        <input
          id="nomor-wa"
          v-model="nomor"
          type="tel"
          inputmode="tel"
          class="field-input"
          placeholder="0812 3456 7890"
        />
        <p v-if="!nomorValid" class="mt-1 text-sm text-rose-700">
          Nomor belum valid. Pakai nomor HP Indonesia, mis. 0812...
        </p>
      </div>
      <div>
        <label for="pesan-wa" class="field-label">Pesan otomatis</label>
        <textarea id="pesan-wa" v-model="pesan" rows="3" class="field-input" />
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="template in TEMPLATES"
            :key="template"
            type="button"
            class="btn-secondary py-1 text-xs"
            @click="pesan = template"
          >
            {{ template.split('\n')[0] }}
          </button>
        </div>
      </div>
      <div v-if="link" class="space-y-2" aria-live="polite">
        <p class="break-all rounded-lg bg-slate-50 p-3 font-mono text-sm">
          {{ link }}
        </p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-primary" @click="salin">
            {{ copied ? 'Tersalin' : 'Salin link' }}
          </button>
          <a :href="link" target="_blank" rel="noopener" class="btn-secondary"
            >Uji link</a
          >
        </div>
        <QrPreview :value="link" filename="qr-whatsapp" :slug="SLUG" />
      </div>
    </section>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
