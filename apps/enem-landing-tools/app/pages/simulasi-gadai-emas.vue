<script setup lang="ts">
import { KARAT } from '~/data/emas/karat';
import { CHECKED_AT, KCA, KRASIDA, SUMBER_GADAI } from '~/data/gadai';
import { formatRupiah } from '~/utils/format';
import {
  adminKca,
  angsuranFlat,
  tabelTebusKca,
  taksiranEmas,
  tebusKca,
} from '~/utils/gadai';

const SLUG = 'simulasi-gadai-emas';
const events = useToolEvents(SLUG);
const { data: harga } = useHargaEmas();
const form = reactive({
  produk: 'kca' as 'kca' | 'krasida',
  gram: 0,
  kadar: 75,
  hargaPerGram: 0,
  rasio: KCA.rasioTaksirMin,
  pinjaman: 0,
  sewaKca: KCA.sewaModalPer15HariMaks,
  hari: 30,
  admin: KCA.adminTerbesar,
  sewaKrasida: KRASIDA.sewaModalPerBulanMin,
  tenor: 12,
});
watch(
  () => harga.value?.pricePerGram,
  (p) => {
    if (p && !form.hargaPerGram) form.hargaPerGram = p;
  },
  { immediate: true },
);
watch(
  () => form.produk,
  (p) =>
    (form.rasio = p === 'krasida' ? KRASIDA.rasioTaksir : KCA.rasioTaksirMin),
);
const taksiran = computed(() =>
  taksiranEmas(form.gram, form.kadar, form.hargaPerGram),
);
const maks = computed(() => (taksiran.value * form.rasio) / 100);
const pinjaman = computed(() =>
  form.pinjaman > 0
    ? Math.min(form.pinjaman, maks.value || form.pinjaman)
    : maks.value,
);
watch(pinjaman, (p) => {
  const a = adminKca(p);
  if (a !== null) form.admin = a;
});
const kca = computed(() =>
  form.produk === 'kca' && pinjaman.value > 0
    ? {
        tebus: tebusKca(pinjaman.value, form.sewaKca, form.hari, form.admin),
        tabel: tabelTebusKca(pinjaman.value, form.sewaKca),
      }
    : null,
);
const krasida = computed(() =>
  form.produk === 'krasida' && pinjaman.value > 0
    ? angsuranFlat(pinjaman.value, form.sewaKrasida, form.tenor)
    : null,
);
let dicatat = false;
watch([kca, krasida], () => {
  if (!dicatat && (kca.value || krasida.value)) {
    dicatat = true;
    events.calculate(form.produk);
  }
});
const faqs = [
  {
    q: 'Gadai emas 10 gram dapat berapa?',
    a: 'Pinjaman = berat x kadar x harga taksiran per gram x rasio taksir (92%-95% di Pegadaian). Harga taksiran ditentukan penaksir di cabang, jadi hasil di sini perkiraan.',
  },
  {
    q: 'Bagaimana sewa modal gadai emas dihitung?',
    a: 'Untuk gadai emas 120 hari (KCA), sewa modal 1%-1,2% per 15 hari sesuai besar pinjaman. Hari ke-1 sampai ke-15 dihitung satu periode, hari ke-16 mulai periode kedua, dan seterusnya.',
  },
  {
    q: 'Apa bedanya dengan gadai emas angsuran?',
    a: 'Gadai emas angsuran (Krasida) dibayar cicilan tetap tiap bulan dengan tarif 1,25%-1,40% per bulan dan tenor 6 sampai 36 bulan.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Simulasi Gadai Emas"
    seo-title="Simulasi Gadai Emas: Taksiran, Sewa Modal per 15 Hari, dan Angsuran"
    description="Hitung perkiraan pinjaman dari emas yang digadaikan, sewa modal per 15 hari dan total tebusan, atau angsuran gadai emas bulanan, dengan tarif dari Pegadaian."
    :faqs="faqs"
    application-category="FinanceApplication"
    :sources="SUMBER_GADAI"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Harga taksiran Pegadaian berbeda dari harga spot; isi harga taksiran per gram bila tahu. Tarif dan biaya admin pasti ditentukan saat akad di cabang.',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent>
      <fieldset class="sm:col-span-2">
        <legend class="field-label">Produk</legend>
        <label class="mr-4 text-sm"
          ><input v-model="form.produk" type="radio" value="kca" /> Gadai emas
          120 hari (tebus sekaligus)</label
        >
        <label class="text-sm"
          ><input v-model="form.produk" type="radio" value="krasida" /> Gadai
          emas angsuran (bulanan)</label
        >
      </fieldset>
      <div>
        <label for="gadai-gram" class="field-label">Berat emas (gram)</label
        ><input
          id="gadai-gram"
          v-model.number="form.gram"
          type="number"
          min="0"
          step="any"
          class="field-input"
        />
      </div>
      <div>
        <label for="gadai-kadar" class="field-label">Kadar</label>
        <select
          id="gadai-kadar"
          v-model.number="form.kadar"
          class="field-input"
        >
          <option v-for="k in KARAT" :key="k.karat" :value="k.kadarPersen">
            {{ k.label }}
          </option>
        </select>
      </div>
      <RupiahInput
        id="gadai-harga"
        v-model="form.hargaPerGram"
        label="Harga taksiran per gram (24K)"
        hint="Terisi harga spot sebagai perkiraan; ganti dengan harga taksiran Pegadaian bila tahu."
      />
      <div>
        <label for="gadai-rasio" class="field-label">Rasio taksir (%)</label
        ><input
          id="gadai-rasio"
          v-model.number="form.rasio"
          type="number"
          min="1"
          max="100"
          class="field-input"
        />
      </div>
      <RupiahInput
        id="gadai-pinjaman"
        v-model="form.pinjaman"
        label="Pinjaman yang diambil (kosongkan untuk maksimal)"
      />
      <template v-if="form.produk === 'kca'">
        <div>
          <label for="gadai-sewa" class="field-label"
            >Sewa modal per 15 hari (%)</label
          ><input
            id="gadai-sewa"
            v-model.number="form.sewaKca"
            type="number"
            :min="0"
            max="5"
            step="0.01"
            class="field-input"
          />
        </div>
        <div>
          <label for="gadai-hari" class="field-label"
            >Ditebus setelah (hari)</label
          ><input
            id="gadai-hari"
            v-model.number="form.hari"
            type="number"
            min="1"
            :max="KCA.tenorHari"
            class="field-input"
          />
        </div>
        <RupiahInput
          id="gadai-admin"
          v-model="form.admin"
          label="Biaya administrasi"
        />
      </template>
      <template v-else>
        <div>
          <label for="gadai-sewa-bulan" class="field-label"
            >Sewa modal per bulan (%)</label
          ><input
            id="gadai-sewa-bulan"
            v-model.number="form.sewaKrasida"
            type="number"
            min="0"
            max="5"
            step="0.01"
            class="field-input"
          />
        </div>
        <div>
          <label for="gadai-tenor" class="field-label">Tenor</label
          ><select
            id="gadai-tenor"
            v-model.number="form.tenor"
            class="field-input"
          >
            <option v-for="t in KRASIDA.tenor" :key="t" :value="t">
              {{ t }} bulan
            </option>
          </select>
        </div>
      </template>
    </form>
    <section v-if="kca || krasida" class="card space-y-3" aria-live="polite">
      <p class="tabular text-sm">
        Taksiran emas {{ formatRupiah(taksiran) }} · pinjaman
        {{ formatRupiah(pinjaman) }}
      </p>
      <template v-if="kca">
        <p class="text-sm text-slate-600">
          Total tebusan setelah {{ form.hari }} hari ({{ kca.tebus.periode }}
          periode 15 hari)
        </p>
        <p class="tabular text-3xl font-bold text-teal-800">
          {{ formatRupiah(kca.tebus.tebusan) }}
        </p>
        <p class="tabular text-sm">
          Sewa modal {{ formatRupiah(kca.tebus.sewaModal) }} + biaya admin di
          awal {{ formatRupiah(kca.tebus.admin) }} = biaya
          {{ formatRupiah(kca.tebus.totalBiaya) }}
        </p>
        <table class="tabular w-full text-sm">
          <tbody>
            <tr
              v-for="r in kca.tabel"
              :key="r.sampaiHari"
              class="border-t border-slate-100"
            >
              <td class="py-1">Ditebus sampai hari ke-{{ r.sampaiHari }}</td>
              <td class="py-1 text-right">{{ formatRupiah(r.tebusan) }}</td>
            </tr>
          </tbody>
        </table>
      </template>
      <template v-else-if="krasida">
        <p class="text-sm text-slate-600">Angsuran per bulan</p>
        <p class="tabular text-3xl font-bold text-teal-800">
          {{ formatRupiah(krasida.angsuran) }}
        </p>
        <p class="tabular text-sm">
          Total sewa modal {{ formatRupiah(krasida.totalSewa) }} · total bayar
          {{ formatRupiah(krasida.totalBayar) }}
        </p>
      </template>
    </section>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/harga-emas" class="btn-link">Harga emas hari ini</NuxtLink
      ><NuxtLink to="/simulasi-cicil-emas" class="btn-link"
        >Simulasi cicil emas</NuxtLink
      ><NuxtLink to="/simulasi-kta" class="btn-link"
        >Bandingkan dengan KTA</NuxtLink
      >
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
