<script setup lang="ts">
import { formatPercent, formatRupiah } from '~/utils/format';
import {
  calculateLoan,
  calculateUpfrontCosts,
  installmentRatio,
  scheduleToCsv,
  type LoanMethod,
  type RatePeriod,
} from '~/utils/loan';

const SLUG = 'simulasi-kpr';
const events = useToolEvents(SLUG);

interface KprForm {
  price: number;
  dpMode: 'persen' | 'nominal';
  dpPct: number;
  dpAmount: number;
  tenorYears: number;
  periods: { years: number; annualRate: number }[];
  floatingRate: number;
  method: LoanMethod;
  income: number;
  costs: {
    provisiPct: number;
    administrasi: number;
    appraisal: number;
    notaris: number;
    asuransiPct: number;
    bphtbPct: number;
    npoptkp: number;
  };
  prepay: {
    enabled: boolean;
    month: number;
    amount: number;
    mode: 'tenor' | 'cicilan';
    penaltyPct: number;
  };
}

const defaults = (): KprForm => ({
  price: 0,
  dpMode: 'persen',
  dpPct: 20,
  dpAmount: 0,
  tenorYears: 20,
  periods: [
    { years: 3, annualRate: 3.5 },
    { years: 2, annualRate: 7 },
  ],
  floatingRate: 11,
  method: 'anuitas',
  income: 0,
  costs: {
    provisiPct: 1,
    administrasi: 500_000,
    appraisal: 1_000_000,
    notaris: 5_000_000,
    asuransiPct: 2,
    bphtbPct: 5,
    npoptkp: 80_000_000,
  },
  prepay: {
    enabled: false,
    month: 36,
    amount: 0,
    mode: 'tenor',
    penaltyPct: 1,
  },
});

const form = reactive(defaults());
const submitted = ref(false);
const showYearly = ref(true);

onMounted(() => {
  const shared = useSharedState<KprForm>(SLUG);
  if (shared) {
    Object.assign(form, { ...defaults(), ...shared });
    submitted.value = true;
  }
});

const downPayment = computed(() =>
  form.dpMode === 'persen'
    ? Math.round((form.price * form.dpPct) / 100)
    : form.dpAmount,
);
const loanAmount = computed(() => Math.max(0, form.price - downPayment.value));
const tenorMonths = computed(() =>
  Math.max(1, Math.round(form.tenorYears * 12)),
);

const ratePeriods = computed<RatePeriod[]>(() => {
  const periods: RatePeriod[] = [];
  let used = 0;
  for (const period of form.periods) {
    const months = Math.min(
      Math.round(period.years * 12),
      tenorMonths.value - used,
    );
    if (months <= 0) break;
    periods.push({ months, annualRate: period.annualRate });
    used += months;
  }
  if (used < tenorMonths.value) {
    periods.push({
      months: tenorMonths.value - used,
      annualRate: form.floatingRate,
    });
  }
  return periods;
});

const result = computed(() =>
  calculateLoan({
    principal: loanAmount.value,
    tenorMonths: tenorMonths.value,
    periods: ratePeriods.value,
    method: form.method,
    prepayment: form.prepay.enabled
      ? {
          month: form.prepay.month,
          amount: form.prepay.amount,
          mode: form.prepay.mode,
          penaltyPct: form.prepay.penaltyPct,
        }
      : null,
  }),
);

const upfront = computed(() =>
  calculateUpfrontCosts({
    propertyPrice: form.price,
    loanAmount: loanAmount.value,
    ...form.costs,
  }),
);

const maxPayment = computed(() =>
  Math.max(0, ...result.value.schedule.map((row) => row.payment)),
);
const ratio = computed(() => installmentRatio(maxPayment.value, form.income));

const yearlyRows = computed(() => {
  const rows: {
    year: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }[] = [];
  for (const row of result.value.schedule) {
    const index = Math.ceil(row.month / 12) - 1;
    const entry = (rows[index] ??= {
      year: index + 1,
      payment: 0,
      principal: 0,
      interest: 0,
      balance: 0,
    });
    entry.payment += row.payment + row.prepayment;
    entry.principal += row.principal + row.prepayment;
    entry.interest += row.interest;
    entry.balance = row.balance;
  }
  return rows;
});

const addPeriod = () => form.periods.push({ years: 1, annualRate: 8 });
const removePeriod = (index: number) => form.periods.splice(index, 1);

const calculate = () => {
  submitted.value = true;
  events.calculate(form.method);
};

const downloadCsv = () => {
  const blob = new Blob([scheduleToCsv(result.value.schedule)], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tabel-amortisasi-kpr.csv';
  link.click();
  URL.revokeObjectURL(url);
  events.download('csv');
};

const faqs = [
  {
    q: 'Apa beda bunga fixed dan floating di KPR?',
    a: 'Bunga fixed berlaku tetap untuk beberapa tahun pertama. Setelah itu bunga mengikuti suku bunga pasar (floating) yang biasanya jauh lebih tinggi, sehingga cicilan bisa melonjak. Simulasi ini menghitung ulang cicilan atas sisa pokok di setiap pergantian periode bunga.',
  },
  {
    q: 'Metode anuitas, efektif, dan flat bedanya apa?',
    a: 'Anuitas: cicilan tetap, porsi bunga besar di awal (dipakai mayoritas KPR). Efektif: pokok tetap, bunga dihitung dari sisa pokok sehingga cicilan menurun. Flat: bunga dihitung dari pokok awal periode sehingga totalnya paling mahal.',
  },
  {
    q: 'Berapa rasio cicilan yang aman?',
    a: 'Sebagai acuan umum, banyak bank melihat cicilan sekitar 30 sampai 40% dari penghasilan bulanan. Ini bukan aturan pasti; tiap bank punya penilaian sendiri.',
  },
  {
    q: 'Biaya apa saja di luar uang muka?',
    a: 'Umumnya provisi, administrasi, appraisal, notaris/PPAT, asuransi jiwa dan kebakaran, serta BPHTB (5% dari harga dikurangi NPOPTKP yang berbeda per daerah). Nilai bawaan di sini bisa kamu ubah.',
  },
];

const howTo = [
  'Isi harga properti dan uang muka (persen atau nominal).',
  'Tentukan tenor, lalu atur periode bunga fixed dan bunga floating sesudahnya.',
  'Isi penghasilan bulanan bila ingin melihat rasio cicilan terhadap penghasilan.',
  'Sesuaikan biaya awal (provisi, notaris, asuransi, BPHTB) dan, bila perlu, simulasi pelunasan sebagian.',
  "Tekan 'Hitung cicilan' untuk melihat cicilan per periode, total bunga, grafik, dan tabel amortisasi yang bisa diunduh sebagai CSV.",
];
</script>

<template>
  <ToolShell
    :how-to="howTo"
    :slug="SLUG"
    title="Simulasi KPR"
    seo-title="Simulasi KPR Bunga Fixed dan Floating"
    description="Hitung cicilan KPR bertahap (fixed lalu floating), tabel amortisasi, biaya awal di luar DP, rasio cicilan, dan simulasi pelunasan sebagian."
    :faqs="faqs"
  >
    <form class="card space-y-5" @submit.prevent="calculate">
      <div class="grid gap-4 sm:grid-cols-2">
        <RupiahInput id="harga" v-model="form.price" label="Harga properti" />
        <div>
          <span class="field-label">Uang muka (DP)</span>
          <div class="flex gap-2">
            <div class="seg shrink-0" role="group" aria-label="Satuan DP">
              <button
                type="button"
                :aria-pressed="form.dpMode === 'persen'"
                @click="form.dpMode = 'persen'"
              >
                %
              </button>
              <button
                type="button"
                :aria-pressed="form.dpMode === 'nominal'"
                @click="form.dpMode = 'nominal'"
              >
                Rp
              </button>
            </div>
            <input
              v-if="form.dpMode === 'persen'"
              v-model.number="form.dpPct"
              type="number"
              min="0"
              max="100"
              step="0.5"
              class="field-input"
              aria-label="DP dalam persen"
            />
            <RupiahInput
              v-else
              id="dp"
              v-model="form.dpAmount"
              label="Nominal DP"
              hide-label
              class="flex-1"
            />
          </div>
          <p class="field-hint">
            DP {{ formatRupiah(downPayment) }}, plafon pinjaman
            {{ formatRupiah(loanAmount) }}.
          </p>
        </div>
        <div>
          <label for="tenor" class="field-label">Tenor (tahun)</label>
          <input
            id="tenor"
            v-model.number="form.tenorYears"
            type="number"
            min="1"
            max="30"
            class="field-input"
          />
        </div>
        <div>
          <label for="metode" class="field-label">Metode hitung</label>
          <select id="metode" v-model="form.method" class="field-input">
            <option value="anuitas">Anuitas (umum di KPR)</option>
            <option value="efektif">Efektif</option>
            <option value="flat">Flat</option>
          </select>
        </div>
      </div>

      <fieldset>
        <legend class="field-label">Periode bunga</legend>
        <div class="space-y-2">
          <div
            v-for="(period, index) in form.periods"
            :key="index"
            class="flex flex-wrap items-end gap-2"
          >
            <div class="w-28">
              <label :for="`p-years-${index}`" class="field-hint"
                >Lama (tahun)</label
              >
              <input
                :id="`p-years-${index}`"
                v-model.number="period.years"
                type="number"
                min="0.5"
                step="0.5"
                class="field-input"
              />
            </div>
            <div class="w-32">
              <label :for="`p-rate-${index}`" class="field-hint"
                >Bunga fixed (%/thn)</label
              >
              <input
                :id="`p-rate-${index}`"
                v-model.number="period.annualRate"
                type="number"
                min="0"
                step="0.05"
                class="field-input"
              />
            </div>
            <button
              type="button"
              class="btn-secondary"
              :aria-label="`Hapus periode ${index + 1}`"
              @click="removePeriod(index)"
            >
              Hapus
            </button>
          </div>
          <div class="flex flex-wrap items-end gap-2">
            <div class="w-60">
              <label for="floating" class="field-hint"
                >Bunga floating sesudahnya (%/thn)</label
              >
              <input
                id="floating"
                v-model.number="form.floatingRate"
                type="number"
                min="0"
                step="0.05"
                class="field-input"
              />
            </div>
            <button type="button" class="btn-secondary" @click="addPeriod">
              Tambah periode fixed
            </button>
          </div>
        </div>
      </fieldset>

      <RupiahInput
        id="penghasilan"
        v-model="form.income"
        label="Penghasilan bulanan (opsional)"
        hint="Untuk menghitung rasio cicilan terhadap penghasilan."
      />

      <details class="rounded-xl bg-slate-50 p-4">
        <summary class="cursor-pointer text-sm font-semibold">
          Biaya awal (bisa diubah)
        </summary>
        <div class="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label for="provisi" class="field-label">Provisi (% plafon)</label>
            <input
              id="provisi"
              v-model.number="form.costs.provisiPct"
              type="number"
              min="0"
              step="0.1"
              class="field-input"
            />
          </div>
          <RupiahInput
            id="admin"
            v-model="form.costs.administrasi"
            label="Administrasi"
          />
          <RupiahInput
            id="appraisal"
            v-model="form.costs.appraisal"
            label="Appraisal"
          />
          <RupiahInput
            id="notaris"
            v-model="form.costs.notaris"
            label="Notaris/PPAT"
          />
          <div>
            <label for="asuransi" class="field-label"
              >Asuransi jiwa + kebakaran (% plafon)</label
            >
            <input
              id="asuransi"
              v-model.number="form.costs.asuransiPct"
              type="number"
              min="0"
              step="0.1"
              class="field-input"
            />
          </div>
          <RupiahInput
            id="npoptkp"
            v-model="form.costs.npoptkp"
            label="NPOPTKP daerah (untuk BPHTB)"
            hint="Berbeda per kabupaten/kota; Rp80 juta adalah batas bawah yang umum. Cek perda daerahmu."
          />
        </div>
      </details>

      <details class="rounded-xl bg-slate-50 p-4">
        <summary class="cursor-pointer text-sm font-semibold">
          Simulasi pelunasan sebagian (opsional)
        </summary>
        <div class="mt-3 space-y-4">
          <label class="flex items-center gap-2 text-sm">
            <input
              v-model="form.prepay.enabled"
              type="checkbox"
              class="h-4 w-4 accent-primary"
            />
            Aktifkan pelunasan sebagian
          </label>
          <div v-if="form.prepay.enabled" class="grid gap-4 sm:grid-cols-2">
            <RupiahInput
              id="prepay-amount"
              v-model="form.prepay.amount"
              label="Nominal pelunasan"
            />
            <div>
              <label for="prepay-month" class="field-label">Di bulan ke-</label>
              <input
                id="prepay-month"
                v-model.number="form.prepay.month"
                type="number"
                min="1"
                :max="tenorMonths"
                class="field-input"
              />
            </div>
            <div>
              <label for="prepay-mode" class="field-label"
                >Setelah pelunasan</label
              >
              <select
                id="prepay-mode"
                v-model="form.prepay.mode"
                class="field-input"
              >
                <option value="tenor">Cicilan tetap, tenor lebih pendek</option>
                <option value="cicilan">
                  Tenor tetap, cicilan lebih kecil
                </option>
              </select>
            </div>
            <div>
              <label for="penalty" class="field-label"
                >Denda pelunasan (% dari nominal)</label
              >
              <input
                id="penalty"
                v-model.number="form.prepay.penaltyPct"
                type="number"
                min="0"
                step="0.1"
                class="field-input"
              />
            </div>
          </div>
        </div>
      </details>

      <button type="submit" class="btn-primary" :disabled="loanAmount <= 0">
        Hitung cicilan
      </button>
    </form>

    <template v-if="submitted && loanAmount > 0">
      <section class="card space-y-5" aria-live="polite">
        <div>
          <h2 class="font-semibold">Cicilan per periode bunga</h2>
          <div class="mt-3 grid gap-3 sm:grid-cols-3">
            <div
              v-for="(period, index) in result.periods"
              :key="period.fromMonth"
              class="rounded-xl border border-slate-200 p-3"
            >
              <p class="text-xs text-slate-500">
                Bulan {{ period.fromMonth }} sampai {{ period.toMonth }} ·
                {{ formatPercent(period.annualRate) }}
              </p>
              <p
                class="tabular text-xl font-bold"
                :class="
                  index > 0 &&
                  period.payment > (result.periods[index - 1]?.payment ?? 0)
                    ? 'text-rose-700'
                    : 'text-primary'
                "
              >
                {{ formatRupiah(period.payment) }}
              </p>
              <p
                v-if="index > 0 && result.periods[index - 1]"
                class="text-xs text-slate-600"
              >
                {{
                  period.payment >= result.periods[index - 1]!.payment
                    ? 'Naik'
                    : 'Turun'
                }}
                {{
                  formatRupiah(
                    Math.abs(
                      period.payment - result.periods[index - 1]!.payment,
                    ),
                  )
                }}
              </p>
            </div>
          </div>
          <p v-if="form.method !== 'anuitas'" class="field-hint mt-2">
            Metode {{ form.method }}: cicilan berubah tiap bulan; yang
            ditampilkan adalah cicilan bulan pertama tiap periode.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <div class="tabular">
            <h2 class="font-semibold">Ringkasan</h2>
            <p class="result-row">
              <span>Plafon pinjaman</span
              ><span>{{ formatRupiah(loanAmount) }}</span>
            </p>
            <p class="result-row">
              <span>Total bunga</span
              ><span>{{ formatRupiah(result.totalInterest) }}</span>
            </p>
            <p class="result-row">
              <span>Total pembayaran ke bank</span
              ><span>{{ formatRupiah(result.totalPayment) }}</span>
            </p>
            <p v-if="form.prepay.enabled" class="result-row">
              <span>Denda pelunasan</span
              ><span>{{ formatRupiah(result.prepaymentPenalty) }}</span>
            </p>
            <p v-if="form.prepay.enabled" class="result-row">
              <span>Lunas di bulan ke-</span><span>{{ result.lastMonth }}</span>
            </p>
            <p v-if="ratio !== null" class="result-row">
              <span>Cicilan tertinggi terhadap penghasilan</span>
              <span
                :class="
                  ratio > 40
                    ? 'font-semibold text-rose-700'
                    : ratio > 30
                      ? 'font-semibold text-amber-700'
                      : 'text-primary'
                "
              >
                {{ formatPercent(ratio, 1) }}
              </span>
            </p>
            <p v-if="ratio !== null && ratio > 30" class="field-hint">
              Di atas acuan umum bank (sekitar 30 sampai 40%). Ini bukan aturan
              pasti.
            </p>
          </div>
          <div class="tabular">
            <h2 class="font-semibold">Biaya awal di luar DP</h2>
            <p class="result-row">
              <span>Provisi</span
              ><span>{{ formatRupiah(upfront.provisi) }}</span>
            </p>
            <p class="result-row">
              <span>Administrasi</span
              ><span>{{ formatRupiah(upfront.administrasi) }}</span>
            </p>
            <p class="result-row">
              <span>Appraisal</span
              ><span>{{ formatRupiah(upfront.appraisal) }}</span>
            </p>
            <p class="result-row">
              <span>Notaris/PPAT</span
              ><span>{{ formatRupiah(upfront.notaris) }}</span>
            </p>
            <p class="result-row">
              <span>Asuransi</span
              ><span>{{ formatRupiah(upfront.asuransi) }}</span>
            </p>
            <p class="result-row">
              <span>BPHTB</span><span>{{ formatRupiah(upfront.bphtb) }}</span>
            </p>
            <p class="result-row font-semibold">
              <span>Total biaya awal</span
              ><span>{{ formatRupiah(upfront.total) }}</span>
            </p>
            <p class="result-row font-semibold">
              <span>Total uang yang disiapkan (DP + biaya)</span
              ><span>{{ formatRupiah(downPayment + upfront.total) }}</span>
            </p>
          </div>
        </div>

        <BalanceChart :schedule="result.schedule" :principal="loanAmount" />
      </section>

      <AdSlot placement="result" :slug="SLUG" />

      <section class="card space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-semibold">Tabel amortisasi</h2>
          <div class="flex flex-wrap gap-2">
            <div class="seg" role="group" aria-label="Tampilan tabel">
              <button
                type="button"
                :aria-pressed="showYearly"
                @click="showYearly = true"
              >
                Per tahun
              </button>
              <button
                type="button"
                :aria-pressed="!showYearly"
                @click="showYearly = false"
              >
                Per bulan
              </button>
            </div>
            <button type="button" class="btn-secondary" @click="downloadCsv">
              Unduh CSV
            </button>
          </div>
        </div>
        <div class="-mx-4 max-h-[480px] overflow-auto sm:mx-0">
          <table class="tabular w-full min-w-[560px] text-sm">
            <thead class="sticky top-0 bg-white text-left text-slate-500">
              <tr>
                <th class="px-4 py-2 font-medium sm:px-2">
                  {{ showYearly ? 'Tahun' : 'Bulan' }}
                </th>
                <th class="px-2 py-2 text-right font-medium">
                  {{ showYearly ? 'Dibayar' : 'Cicilan' }}
                </th>
                <th class="px-2 py-2 text-right font-medium">Pokok</th>
                <th class="px-2 py-2 text-right font-medium">Bunga</th>
                <th class="px-4 py-2 text-right font-medium sm:px-2">
                  Sisa pokok
                </th>
              </tr>
            </thead>
            <tbody v-if="showYearly">
              <tr
                v-for="row in yearlyRows"
                :key="row.year"
                class="border-t border-slate-100"
              >
                <td class="px-4 py-2 sm:px-2">{{ row.year }}</td>
                <td class="px-2 py-2 text-right">
                  {{ formatRupiah(row.payment) }}
                </td>
                <td class="px-2 py-2 text-right">
                  {{ formatRupiah(row.principal) }}
                </td>
                <td class="px-2 py-2 text-right">
                  {{ formatRupiah(row.interest) }}
                </td>
                <td class="px-4 py-2 text-right sm:px-2">
                  {{ formatRupiah(row.balance) }}
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr
                v-for="row in result.schedule"
                :key="row.month"
                class="border-t border-slate-100"
              >
                <td class="px-4 py-2 sm:px-2">{{ row.month }}</td>
                <td class="px-2 py-2 text-right">
                  {{ formatRupiah(row.payment) }}
                  <span v-if="row.prepayment" class="block text-xs text-primary"
                    >+ pelunasan {{ formatRupiah(row.prepayment) }}</span
                  >
                </td>
                <td class="px-2 py-2 text-right">
                  {{ formatRupiah(row.principal) }}
                </td>
                <td class="px-2 py-2 text-right">
                  {{ formatRupiah(row.interest) }}
                </td>
                <td class="px-4 py-2 text-right sm:px-2">
                  {{ formatRupiah(row.balance) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="flex flex-wrap gap-3">
        <ShareButton :tool-id="SLUG" :state="form" title="Simulasi KPR" />
      </div>
      <DonationCta placement="after-result" :slug="SLUG" />
    </template>
  </ToolShell>
</template>
