<script setup lang="ts">
import { imageFileToDataUrl } from '~/composables/use-invoice-store';

const { store } = useInvoiceStore();
const profile = computed(() => store.value.profile);

const pickImage = async (
  event: Event,
  field: 'logoDataUrl' | 'qrisDataUrl',
  maxSize: number,
) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  (event.target as HTMLInputElement).value = '';
  if (file)
    store.value.profile[field] = await imageFileToDataUrl(file, maxSize);
};
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <div>
      <label for="usaha-nama" class="field-label">Nama usaha</label>
      <input id="usaha-nama" v-model="profile.name" class="field-input" />
    </div>
    <div>
      <label for="usaha-telepon" class="field-label">Telepon/WhatsApp</label>
      <input id="usaha-telepon" v-model="profile.phone" class="field-input" />
    </div>
    <div class="sm:col-span-2">
      <label for="usaha-alamat" class="field-label">Alamat</label>
      <textarea
        id="usaha-alamat"
        v-model="profile.address"
        rows="2"
        class="field-input"
      />
    </div>
    <div>
      <label for="usaha-email" class="field-label">Email</label>
      <input
        id="usaha-email"
        v-model="profile.email"
        type="email"
        class="field-input"
      />
    </div>
    <div>
      <label for="usaha-bank" class="field-label">Bank</label>
      <input
        id="usaha-bank"
        v-model="profile.bankName"
        class="field-input"
        placeholder="BCA, BRI, Mandiri, ..."
      />
    </div>
    <div>
      <label for="usaha-rekening" class="field-label">No. rekening</label>
      <input
        id="usaha-rekening"
        v-model="profile.bankAccount"
        class="field-input"
        inputmode="numeric"
      />
    </div>
    <div>
      <label for="usaha-pemilik" class="field-label">Atas nama</label>
      <input
        id="usaha-pemilik"
        v-model="profile.bankHolder"
        class="field-input"
      />
    </div>
    <div>
      <span class="field-label">Logo (opsional)</span>
      <div class="flex items-center gap-3">
        <img
          v-if="profile.logoDataUrl"
          :src="profile.logoDataUrl"
          alt="Logo usaha"
          class="h-12 w-auto rounded border border-slate-200 bg-white"
        />
        <label class="btn-secondary cursor-pointer">
          {{ profile.logoDataUrl ? 'Ganti' : 'Pilih logo' }}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="hidden"
            @change="pickImage($event, 'logoDataUrl', 400)"
          />
        </label>
        <button
          v-if="profile.logoDataUrl"
          type="button"
          class="text-sm text-rose-700"
          @click="profile.logoDataUrl = ''"
        >
          Hapus
        </button>
      </div>
    </div>
    <div>
      <span class="field-label">Gambar QRIS (opsional)</span>
      <div class="flex items-center gap-3">
        <img
          v-if="profile.qrisDataUrl"
          :src="profile.qrisDataUrl"
          alt="QRIS"
          class="h-12 w-12 rounded border border-slate-200 bg-white object-contain"
        />
        <label class="btn-secondary cursor-pointer">
          {{ profile.qrisDataUrl ? 'Ganti' : 'Pilih QRIS' }}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="hidden"
            @change="pickImage($event, 'qrisDataUrl', 600)"
          />
        </label>
        <button
          v-if="profile.qrisDataUrl"
          type="button"
          class="text-sm text-rose-700"
          @click="profile.qrisDataUrl = ''"
        >
          Hapus
        </button>
      </div>
    </div>
    <div>
      <label for="pola-invoice" class="field-label">Format nomor invoice</label>
      <input
        id="pola-invoice"
        v-model="profile.invoicePattern"
        class="field-input"
      />
      <p class="field-hint">
        {YYYY} tahun, {MM} bulan, {DD} tanggal, {NNN} nomor urut.
      </p>
    </div>
    <div>
      <label for="urut-invoice" class="field-label"
        >Nomor urut berikutnya</label
      >
      <input
        id="urut-invoice"
        v-model.number="profile.nextInvoiceSequence"
        type="number"
        min="1"
        class="field-input"
      />
    </div>
    <div>
      <label for="template" class="field-label">Tampilan</label>
      <select id="template" v-model="profile.template" class="field-input">
        <option value="modern">Modern</option>
        <option value="klasik">Klasik</option>
        <option value="ringkas">Ringkas</option>
      </select>
    </div>
    <label class="flex items-center gap-2 self-end text-sm">
      <input
        v-model="profile.showFooterCredit"
        type="checkbox"
        class="h-4 w-4 accent-primary"
      />
      Tampilkan "Dibuat dengan tools.muzanella.com" di PDF
    </label>
  </div>
</template>
