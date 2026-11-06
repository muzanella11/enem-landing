<script setup lang="ts">
import { qrKontak, qrWifi } from '~/utils/qr';

const SLUG = 'buat-qr-code';
const jenis = ref<'url' | 'teks' | 'wifi' | 'kontak'>('url');
const form = reactive({
  url: 'https://',
  teks: '',
  ssid: '',
  password: '',
  keamanan: 'WPA' as 'WPA' | 'WEP' | 'nopass',
  tersembunyi: false,
  nama: '',
  telepon: '',
  email: '',
  organisasi: '',
});
const value = computed(() => {
  if (jenis.value === 'url') return form.url.length > 8 ? form.url : '';
  if (jenis.value === 'teks') return form.teks;
  if (jenis.value === 'wifi')
    return form.ssid
      ? qrWifi(form.ssid, form.password, form.keamanan, form.tersembunyi)
      : '';
  return form.nama ? qrKontak(form) : '';
});
const faqs = [
  {
    q: 'Apakah QR code ini bisa untuk pembayaran (QRIS)?',
    a: 'Tidak. QRIS adalah standar Bank Indonesia dan hanya diterbitkan oleh penyedia jasa pembayaran. Tool ini membuat QR biasa untuk link, teks, WiFi, dan kontak.',
  },
  {
    q: 'Apakah password WiFi saya dikirim?',
    a: 'Tidak. QR dibuat di browsermu; data WiFi dan kontak tidak dikirim ke server.',
  },
  {
    q: 'Apakah QR code-nya kedaluwarsa?',
    a: 'Tidak. QR berisi data langsung (bukan shortlink), jadi tetap berfungsi selama tujuannya ada.',
  },
];
const howTo = [
  'Pilih jenis QR: link, teks, WiFi, atau kontak.',
  'Isi datanya; pratinjau langsung muncul.',
  'Atur warna dan ukuran, lalu unduh PNG atau SVG.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Buat QR Code"
    seo-title="Buat QR Code Gratis untuk Link, WiFi, dan Kontak"
    description="Buat QR code gratis untuk link, teks, WiFi, dan kartu kontak, unduh PNG atau SVG. Dibuat di browser, tanpa kedaluwarsa."
    application-category="UtilitiesApplication"
    :faqs="faqs"
    :how-to="howTo"
    checked-at="2026-11-06"
  >
    <section class="card space-y-4">
      <div class="seg" role="group" aria-label="Jenis QR">
        <button
          v-for="item in [
            ['url', 'Link'],
            ['teks', 'Teks'],
            ['wifi', 'WiFi'],
            ['kontak', 'Kontak'],
          ] as const"
          :key="item[0]"
          type="button"
          :aria-pressed="jenis === item[0]"
          @click="jenis = item[0]"
        >
          {{ item[1] }}
        </button>
      </div>
      <div v-if="jenis === 'url'">
        <label for="qr-url" class="field-label">Link</label>
        <input id="qr-url" v-model="form.url" type="url" class="field-input" />
      </div>
      <div v-else-if="jenis === 'teks'">
        <label for="qr-teks" class="field-label">Teks</label>
        <textarea
          id="qr-teks"
          v-model="form.teks"
          rows="3"
          class="field-input"
        />
      </div>
      <div v-else-if="jenis === 'wifi'" class="grid gap-3 sm:grid-cols-2">
        <div>
          <label for="qr-ssid" class="field-label">Nama WiFi (SSID)</label
          ><input id="qr-ssid" v-model="form.ssid" class="field-input" />
        </div>
        <div>
          <label for="qr-pass" class="field-label">Password</label
          ><input
            id="qr-pass"
            v-model="form.password"
            class="field-input"
            :disabled="form.keamanan === 'nopass'"
          />
        </div>
        <div>
          <label for="qr-keamanan" class="field-label">Keamanan</label>
          <select id="qr-keamanan" v-model="form.keamanan" class="field-input">
            <option value="WPA">WPA/WPA2</option>
            <option value="WEP">WEP</option>
            <option value="nopass">Tanpa password</option>
          </select>
        </div>
        <label class="flex items-center gap-2 self-end text-sm"
          ><input
            v-model="form.tersembunyi"
            type="checkbox"
            class="h-4 w-4 accent-teal-700"
          />
          Jaringan tersembunyi</label
        >
      </div>
      <div v-else class="grid gap-3 sm:grid-cols-2">
        <div>
          <label for="qr-nama" class="field-label">Nama</label
          ><input id="qr-nama" v-model="form.nama" class="field-input" />
        </div>
        <div>
          <label for="qr-telp" class="field-label">Telepon</label
          ><input
            id="qr-telp"
            v-model="form.telepon"
            type="tel"
            class="field-input"
          />
        </div>
        <div>
          <label for="qr-email" class="field-label">Email</label
          ><input
            id="qr-email"
            v-model="form.email"
            type="email"
            class="field-input"
          />
        </div>
        <div>
          <label for="qr-org" class="field-label">Usaha/organisasi</label
          ><input id="qr-org" v-model="form.organisasi" class="field-input" />
        </div>
      </div>
      <QrPreview :value="value" :filename="`qr-${jenis}`" :slug="SLUG" />
    </section>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
