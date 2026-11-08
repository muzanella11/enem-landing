<script setup lang="ts">
import { ZAKAT_RULES } from '~/data/zakat/rules';
import { formatRupiah, formatThousands } from '~/utils/format';
import {
  nisabBulanan,
  nisabTahunan,
  zakatFitrah,
  zakatMaal,
  zakatPenghasilan,
} from '~/utils/zakat';

const SLUG = 'kalkulator-zakat';
const events = useToolEvents(SLUG);

type Mode = 'penghasilan' | 'maal' | 'fitrah';

interface GoldPrice {
  pricePerGram: number | null;
  updatedAt: string | null;
  source: string;
  stale: boolean;
}

// Only the gold price comes from the server; nothing the user types is sent.
const { data: gold, status: goldStatus } = useFetch<GoldPrice>(
  '/api/harga-emas',
  {
    key: 'harga-emas',
    server: false,
    default: () => ({
      pricePerGram: null,
      updatedAt: null,
      source: '',
      stale: true,
    }),
  },
);

const defaults = () => ({
  mode: 'penghasilan' as Mode,
  goldOverride: 0,
  penghasilan: {
    penghasilanBulanan: 0,
    penghasilanLain: 0,
    kebutuhanPokok: 0,
    mode: 'bruto' as 'bruto' | 'neto',
  },
  maal: {
    tabungan: 0,
    deposito: 0,
    emasGram: 0,
    investasi: 0,
    piutang: 0,
    utangJatuhTempo: 0,
  },
  fitrah: {
    jiwa: 1,
    mode: 'uang' as 'uang' | 'beras',
    uangPerJiwa: ZAKAT_RULES.fitrah.uangPerJiwa,
    berasKgPerJiwa: ZAKAT_RULES.fitrah.berasKgPerJiwa,
  },
});

const form = reactive(defaults());
const submitted = ref(false);

onMounted(() => {
  const shared = useSharedState<ReturnType<typeof defaults>>(SLUG);
  if (shared) {
    Object.assign(form, { ...defaults(), ...shared });
    submitted.value = true;
  }
});

// `server: false` leaves the request 'idle' during SSR. Treating that as
// loading keeps the server HTML and the hydrating client identical; showing
// "not available" on the server caused a hydration mismatch (console error,
// PageSpeed best practices).
const goldPending = computed(
  () => goldStatus.value === 'idle' || goldStatus.value === 'pending',
);

const goldPrice = computed(
  () => form.goldOverride || gold.value?.pricePerGram || 0,
);
const goldUpdated = computed(() =>
  gold.value?.updatedAt
    ? new Date(gold.value.updatedAt).toLocaleString('id-ID', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : null,
);

const penghasilan = computed(() =>
  zakatPenghasilan({ ...form.penghasilan, goldPricePerGram: goldPrice.value }),
);
const maal = computed(() =>
  zakatMaal({ ...form.maal, goldPricePerGram: goldPrice.value }),
);
const fitrah = computed(() => zakatFitrah(form.fitrah));

const needsGold = computed(() => form.mode !== 'fitrah');
const canCalculate = computed(() => !needsGold.value || goldPrice.value > 0);

const calculate = () => {
  submitted.value = true;
  events.calculate(form.mode);
};

const faqs = [
  {
    q: 'Berapa nisab zakat?',
    a: 'Nisab zakat maal dan zakat penghasilan setara 85 gram emas per tahun. Untuk zakat penghasilan yang dibayar bulanan, nisabnya 85 gram emas dibagi 12.',
  },
  {
    q: 'Zakat penghasilan dihitung dari gaji kotor atau bersih?',
    a: 'Ada dua pendapat. Ketentuan BAZNAS menghitung dari penghasilan kotor (bruto); sebagian ulama membolehkan setelah dikurangi kebutuhan pokok (neto). Kalkulator ini menyediakan keduanya, dengan bawaan mengikuti BAZNAS.',
  },
  {
    q: 'Apa itu haul pada zakat maal?',
    a: 'Harta yang dizakati harus sudah dimiliki selama satu tahun hijriah (haul) dan nilainya mencapai nisab. Utang yang jatuh tempo boleh dikurangkan.',
  },
  {
    q: 'Berapa zakat fitrah per orang?',
    a: 'Zakat fitrah 2,5 kg atau 3,5 liter beras per jiwa, atau uang senilai itu sesuai ketetapan BAZNAS daerah setempat.',
  },
];

const howTo = [
  'Pilih jenis zakat: penghasilan, maal, atau fitrah.',
  'Periksa harga emas terbaru yang dipakai untuk nisab, atau isi harga emas sendiri.',
  'Isi penghasilan, harta, atau jumlah jiwa sesuai jenis zakat.',
  "Tekan 'Hitung zakat' untuk melihat apakah sudah mencapai nisab dan berapa zakat yang perlu dibayar.",
];
</script>

<template>
  <ToolShell
    :how-to="howTo"
    :slug="SLUG"
    title="Kalkulator Zakat"
    seo-title="Kalkulator Zakat Penghasilan, Maal, dan Fitrah"
    description="Hitung zakat penghasilan, zakat maal, dan zakat fitrah dengan nisab dari harga emas terbaru, mengacu ketentuan BAZNAS."
    application-category="LifestyleApplication"
    :faqs="faqs"
    :sources="ZAKAT_RULES.sources"
    :checked-at="ZAKAT_RULES.checkedAt"
    :caveats="ZAKAT_RULES.caveats"
  >
    <form class="card space-y-5" @submit.prevent="calculate">
      <div class="seg" role="group" aria-label="Jenis zakat">
        <button
          type="button"
          :aria-pressed="form.mode === 'penghasilan'"
          @click="form.mode = 'penghasilan'"
        >
          Penghasilan
        </button>
        <button
          type="button"
          :aria-pressed="form.mode === 'maal'"
          @click="form.mode = 'maal'"
        >
          Maal
        </button>
        <button
          type="button"
          :aria-pressed="form.mode === 'fitrah'"
          @click="form.mode = 'fitrah'"
        >
          Fitrah
        </button>
      </div>

      <!-- Heights are reserved for the price status and the nisab line: the
           price arrives after load (client-only fetch), and growing these
           lines then pushed the form down (PageSpeed CLS). -->
      <div v-if="needsGold" class="rounded-xl bg-slate-50 p-4 text-sm">
        <div class="min-h-[3.75rem] sm:min-h-[2.75rem]">
          <p v-if="goldPending">Mengambil harga emas terbaru...</p>
          <template v-else>
            <p v-if="gold?.pricePerGram">
              Harga emas:
              <strong class="tabular"
                >{{ formatRupiah(gold.pricePerGram) }}/gram</strong
              >
              <span v-if="goldUpdated" class="text-slate-500">
                (per {{ goldUpdated
                }}{{
                  gold.stale ? ', harga terakhir yang tersimpan' : ''
                }})</span
              >
            </p>
            <p v-else class="text-amber-800">
              Harga emas otomatis sedang tidak tersedia. Isi harga emas di
              bawah.
            </p>
            <p v-if="gold?.source" class="text-xs text-slate-500">
              Sumber: {{ gold.source }}
            </p>
          </template>
        </div>
        <div class="mt-3 max-w-xs">
          <RupiahInput
            id="harga-emas"
            v-model="form.goldOverride"
            label="Pakai harga emas sendiri (opsional)"
            hint="Mis. harga emas batangan Antam hari ini, per gram."
          />
        </div>
        <p class="mt-2 min-h-[2.5rem] text-slate-600 sm:min-h-[1.25rem]">
          <template v-if="goldPrice > 0">
            Nisab: {{ formatRupiah(nisabTahunan(goldPrice)) }} per tahun ({{
              formatRupiah(nisabBulanan(goldPrice))
            }}
            per bulan).
          </template>
        </p>
      </div>

      <div v-if="form.mode === 'penghasilan'" class="grid gap-4 sm:grid-cols-2">
        <RupiahInput
          id="penghasilan"
          v-model="form.penghasilan.penghasilanBulanan"
          label="Penghasilan per bulan"
        />
        <RupiahInput
          id="penghasilan-lain"
          v-model="form.penghasilan.penghasilanLain"
          label="Penghasilan lain per bulan"
        />
        <div class="sm:col-span-2">
          <span class="field-label">Dihitung dari</span>
          <div class="seg" role="group" aria-label="Dasar hitung">
            <button
              type="button"
              :aria-pressed="form.penghasilan.mode === 'bruto'"
              @click="form.penghasilan.mode = 'bruto'"
            >
              Penghasilan kotor (BAZNAS)
            </button>
            <button
              type="button"
              :aria-pressed="form.penghasilan.mode === 'neto'"
              @click="form.penghasilan.mode = 'neto'"
            >
              Setelah kebutuhan pokok
            </button>
          </div>
        </div>
        <RupiahInput
          v-if="form.penghasilan.mode === 'neto'"
          id="kebutuhan"
          v-model="form.penghasilan.kebutuhanPokok"
          label="Kebutuhan pokok per bulan"
        />
      </div>

      <div v-else-if="form.mode === 'maal'" class="grid gap-4 sm:grid-cols-2">
        <RupiahInput
          id="tabungan"
          v-model="form.maal.tabungan"
          label="Tabungan dan uang tunai"
        />
        <RupiahInput
          id="deposito"
          v-model="form.maal.deposito"
          label="Deposito"
        />
        <div>
          <label for="emas" class="field-label"
            >Emas dan perhiasan simpanan (gram)</label
          >
          <input
            id="emas"
            v-model.number="form.maal.emasGram"
            type="number"
            min="0"
            step="0.01"
            class="field-input"
          />
        </div>
        <RupiahInput
          id="investasi"
          v-model="form.maal.investasi"
          label="Saham, reksa dana, dan investasi lain"
        />
        <RupiahInput
          id="piutang"
          v-model="form.maal.piutang"
          label="Piutang yang bisa ditagih"
        />
        <RupiahInput
          id="utang"
          v-model="form.maal.utangJatuhTempo"
          label="Utang jatuh tempo"
        />
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="jiwa" class="field-label">Jumlah jiwa</label>
          <input
            id="jiwa"
            v-model.number="form.fitrah.jiwa"
            type="number"
            min="1"
            class="field-input"
          />
        </div>
        <div>
          <span class="field-label">Dibayar dengan</span>
          <div class="seg" role="group" aria-label="Bentuk zakat fitrah">
            <button
              type="button"
              :aria-pressed="form.fitrah.mode === 'uang'"
              @click="form.fitrah.mode = 'uang'"
            >
              Uang
            </button>
            <button
              type="button"
              :aria-pressed="form.fitrah.mode === 'beras'"
              @click="form.fitrah.mode = 'beras'"
            >
              Beras
            </button>
          </div>
        </div>
        <RupiahInput
          v-if="form.fitrah.mode === 'uang'"
          id="fitrah-uang"
          v-model="form.fitrah.uangPerJiwa"
          label="Nilai per jiwa"
          :hint="`Bawaan: ${ZAKAT_RULES.fitrah.uangSourceLabel}. Sesuaikan dengan ketetapan BAZNAS daerahmu.`"
        />
      </div>

      <button type="submit" class="btn-primary" :disabled="!canCalculate">
        Hitung zakat
      </button>
    </form>

    <section
      v-if="submitted && canCalculate"
      class="card space-y-3"
      aria-live="polite"
    >
      <template v-if="form.mode === 'penghasilan'">
        <p class="text-sm text-slate-500">Zakat penghasilan per bulan</p>
        <p class="tabular text-3xl font-bold text-teal-800">
          {{ formatRupiah(penghasilan.perBulan) }}
        </p>
        <p class="text-sm text-slate-700">
          <template v-if="penghasilan.wajib">
            Penghasilan {{ formatRupiah(penghasilan.dasar) }} sudah mencapai
            nisab bulanan {{ formatRupiah(penghasilan.nisabBulanan) }}. Zakat
            2,5% per bulan, atau {{ formatRupiah(penghasilan.perTahun) }} per
            tahun.
          </template>
          <template v-else>
            Penghasilan {{ formatRupiah(penghasilan.dasar) }} belum mencapai
            nisab bulanan {{ formatRupiah(penghasilan.nisabBulanan) }}, jadi
            belum wajib zakat penghasilan. Kamu tetap bisa bersedekah.
          </template>
        </p>
      </template>
      <template v-else-if="form.mode === 'maal'">
        <p class="text-sm text-slate-500">Zakat maal</p>
        <p class="tabular text-3xl font-bold text-teal-800">
          {{ formatRupiah(maal.zakat) }}
        </p>
        <div class="tabular">
          <p class="result-row">
            <span>Nilai emas ({{ form.maal.emasGram }} gram)</span
            ><span>{{ formatRupiah(maal.nilaiEmas) }}</span>
          </p>
          <p class="result-row">
            <span>Total harta bersih</span
            ><span>{{ formatRupiah(maal.totalHarta) }}</span>
          </p>
          <p class="result-row">
            <span>Nisab (85 gram emas)</span
            ><span>{{ formatRupiah(maal.nisab) }}</span>
          </p>
        </div>
        <p class="text-sm text-slate-700">
          {{
            maal.wajib
              ? 'Harta sudah mencapai nisab.'
              : 'Harta belum mencapai nisab, belum wajib zakat maal.'
          }}
          Zakat maal wajib bila harta sudah dimiliki satu tahun hijriah (haul).
        </p>
      </template>
      <template v-else>
        <p class="text-sm text-slate-500">
          Zakat fitrah untuk {{ form.fitrah.jiwa }} jiwa
        </p>
        <p
          v-if="fitrah.totalUang !== null"
          class="tabular text-3xl font-bold text-teal-800"
        >
          {{ formatRupiah(fitrah.totalUang) }}
        </p>
        <p v-else class="tabular text-3xl font-bold text-teal-800">
          {{ formatThousands(fitrah.totalBerasKg ?? 0) }} kg beras
          <span class="block text-base font-normal text-slate-600"
            >atau sekitar
            {{ fitrah.totalBerasLiter?.toLocaleString('id-ID') }} liter</span
          >
        </p>
      </template>
      <p class="text-sm text-slate-600">
        Salurkan zakat lewat lembaga amil resmi, misalnya
        <a
          href="https://baznas.go.id"
          target="_blank"
          rel="noopener"
          class="btn-link"
          >BAZNAS</a
        >
        atau LAZ yang berizin.
      </p>
      <div class="flex flex-wrap gap-3 pt-2">
        <ShareButton
          :tool-id="SLUG"
          :state="form"
          title="Hasil kalkulator zakat"
        />
      </div>
    </section>

    <!-- No donation CTA near zakat results (Story 22): it only lives in the footer. -->
    <AdSlot v-if="submitted" placement="result" :slug="SLUG" />

    <section class="card text-sm text-slate-700">
      <h2 class="font-semibold text-slate-900">
        Tools lain yang mungkin kamu butuhkan
      </h2>
      <ul class="mt-2 list-disc space-y-1 pl-5">
        <li>
          <NuxtLink to="/kalkulator-gaji-bersih" class="btn-link"
            >Kalkulator gaji bersih</NuxtLink
          >
          untuk tahu penghasilan bersihmu.
        </li>
        <li>
          <NuxtLink to="/simulasi-kpr" class="btn-link">Simulasi KPR</NuxtLink>
          sebelum mengambil rumah.
        </li>
      </ul>
    </section>
  </ToolShell>
</template>
