<script setup lang="ts">
import { formatRupiah } from '~/utils/format';
import {
  hitungPatungan,
  teksPatungan,
  type InputPatungan,
} from '~/utils/patungan';

const SLUG = 'kalkulator-patungan';
const events = useToolEvents(SLUG);
const form = reactive<InputPatungan & { judul: string }>({
  judul: '',
  orang: ['Orang 1', 'Orang 2'],
  item: [{ nama: '', harga: 0, untuk: [] }],
  pajakPersen: 10,
  servicePersen: 0,
  diskon: 0,
  ongkir: 0,
  pembulatan: 100,
});
onMounted(() => {
  const shared = useSharedState<typeof form>(SLUG);
  if (shared) Object.assign(form, shared);
});
const hasil = computed(() =>
  form.item.some((i) => i.harga > 0) ? hitungPatungan(form) : null,
);
let dicatat = false;
watch(hasil, (value) => {
  if (value && !dicatat) {
    dicatat = true;
    events.calculate();
  }
});
const toggle = (item: InputPatungan['item'][number], i: number) => {
  item.untuk = item.untuk.includes(i)
    ? item.untuk.filter((x) => x !== i)
    : [...item.untuk, i];
};
const hapusOrang = (i: number) => {
  form.orang.splice(i, 1);
  for (const item of form.item)
    item.untuk = item.untuk
      .filter((x) => x !== i)
      .map((x) => (x > i ? x - 1 : x));
};
const disalin = ref(false);
const salin = async () => {
  if (!hasil.value) return;
  await navigator.clipboard.writeText(
    teksPatungan(hasil.value, form.judul, formatRupiah),
  );
  disalin.value = true;
  setTimeout(() => (disalin.value = false), 2000);
  events.download('teks');
};
const faqs = [
  {
    q: 'Bagaimana pajak dan service dibagi?',
    a: 'Sebanding dengan pesanan masing-masing: yang pesan lebih mahal menanggung pajak dan service lebih besar. Diskon dan ongkir juga dibagi sebanding.',
  },
  {
    q: 'Apakah nama teman disimpan?',
    a: 'Tidak. Semua hanya ada di perangkat Anda. Link berbagi menyimpan data di bagian # link yang tidak dikirim ke server.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Patungan"
    seo-title="Kalkulator Patungan (Split Bill): Bagi Tagihan dengan Pajak dan Service"
    description="Bagi tagihan makan atau liburan per orang dengan pajak, service, diskon, dan ongkir dibagi adil sesuai pesanan. Hasil siap dikirim ke grup WhatsApp."
    :faqs="faqs"
    application-category="LifestyleApplication"
    checked-at="2026-11-06"
    wide
  >
    <section class="card space-y-3">
      <label for="pat-judul" class="field-label">Judul (opsional)</label>
      <input
        id="pat-judul"
        v-model="form.judul"
        placeholder="mis. Makan malam Jumat"
        class="field-input"
      />
      <p class="field-label">Orang</p>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(_, i) in form.orang"
          :key="i"
          class="flex items-center gap-1"
        >
          <input
            v-model="form.orang[i]"
            :aria-label="`Nama orang ${i + 1}`"
            class="field-input w-32"
          />
          <button
            v-if="form.orang.length > 1"
            type="button"
            class="btn-remove"
            :aria-label="`Hapus orang ${i + 1}`"
            @click="hapusOrang(i)"
          >
            ✕
          </button>
        </span>
        <button
          type="button"
          class="btn-secondary"
          @click="form.orang.push(`Orang ${form.orang.length + 1}`)"
        >
          + Orang
        </button>
      </div>
    </section>
    <section class="card space-y-3">
      <p class="field-label">Pesanan (tanpa centang = dibagi semua)</p>
      <div
        v-for="(item, ii) in form.item"
        :key="ii"
        class="space-y-1 border-t border-slate-100 pt-2"
      >
        <div class="flex gap-2">
          <input
            v-model="item.nama"
            :aria-label="`Nama item ${ii + 1}`"
            placeholder="Item"
            class="field-input"
          />
          <RupiahInput
            :id="`pat-harga-${ii}`"
            v-model="item.harga"
            :label="`Harga item ${ii + 1}`"
            hide-label
          />
          <button
            type="button"
            class="btn-remove"
            :aria-label="`Hapus item ${ii + 1}`"
            @click="form.item.splice(ii, 1)"
          >
            ✕
          </button>
        </div>
        <div class="flex flex-wrap gap-3 text-sm">
          <label
            v-for="(nama, i) in form.orang"
            :key="i"
            class="flex items-center gap-1"
          >
            <input
              type="checkbox"
              :checked="item.untuk.includes(i)"
              @change="toggle(item, i)"
            />
            {{ nama }}
          </label>
        </div>
      </div>
      <button
        type="button"
        class="btn-secondary"
        @click="form.item.push({ nama: '', harga: 0, untuk: [] })"
      >
        + Item
      </button>
    </section>
    <section class="card grid gap-3 sm:grid-cols-3">
      <div>
        <label for="pat-pajak" class="field-label">Pajak (%)</label>
        <input
          id="pat-pajak"
          v-model.number="form.pajakPersen"
          type="number"
          min="0"
          max="30"
          step="0.5"
          class="field-input"
        />
      </div>
      <div>
        <label for="pat-service" class="field-label">Service (%)</label>
        <input
          id="pat-service"
          v-model.number="form.servicePersen"
          type="number"
          min="0"
          max="30"
          step="0.5"
          class="field-input"
        />
      </div>
      <div>
        <label for="pat-bulat" class="field-label">Pembulatan</label>
        <select
          id="pat-bulat"
          v-model.number="form.pembulatan"
          class="field-input"
        >
          <option :value="1">Rp1</option>
          <option :value="100">Rp100</option>
          <option :value="500">Rp500</option>
          <option :value="1000">Rp1.000</option>
        </select>
      </div>
      <RupiahInput
        id="pat-diskon"
        v-model="form.diskon"
        label="Diskon/voucher"
      />
      <RupiahInput id="pat-ongkir" v-model="form.ongkir" label="Ongkir" />
    </section>
    <section v-if="hasil" class="card space-y-3" aria-live="polite">
      <p class="text-sm text-slate-600">Total tagihan</p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ formatRupiah(hasil.total) }}
      </p>
      <ul class="tabular divide-y divide-slate-100">
        <li
          v-for="p in hasil.perOrang"
          :key="p.nama"
          class="flex justify-between py-1"
        >
          <span>{{ p.nama }}</span
          ><strong>{{ formatRupiah(p.bayar) }}</strong>
        </li>
      </ul>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-primary" @click="salin">
          {{ disalin ? 'Tersalin' : 'Salin teks untuk WhatsApp' }}
        </button>
        <ShareButton :tool-id="SLUG" :state="form" title="Patungan" />
      </div>
    </section>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
