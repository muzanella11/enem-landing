<script setup lang="ts">
import { PAYROLL_RULES_2026, PTKP_STATUSES } from '~/data/tax/2026';
import { formatPercent, formatRupiah, MONTH_NAMES } from '~/utils/format';
import { calculateYear, getPtkp, type PayrollInput } from '~/utils/payroll';

const SLUG = 'kalkulator-gaji-bersih';
const rules = PAYROLL_RULES_2026;
const events = useToolEvents(SLUG);

const defaults = (): PayrollInput & { month: number } => ({
  gajiPokok: 0,
  tunjanganTetap: 0,
  tunjanganTidakTetap: 0,
  ptkp: 'TK/0',
  jkkRiskIndex: 0,
  ikutBpjsKesehatan: true,
  ikutBpjsKetenagakerjaan: true,
  thr: 0,
  thrMonth: 3,
  month: new Date().getMonth() + 1,
});

const form = reactive(defaults());
const mode = ref<'bulan' | 'tahun'>('bulan');
const submitted = ref(false);

onMounted(() => {
  const shared = useSharedState<
    ReturnType<typeof defaults> & { mode?: 'bulan' | 'tahun' }
  >(SLUG);
  if (shared) {
    Object.assign(form, { ...defaults(), ...shared });
    if (shared.mode) mode.value = shared.mode;
    submitted.value = true;
  }
});

const year = computed(() => calculateYear(form));
const month = computed(() => year.value.months[form.month - 1]!);
const ptkpValue = computed(() => getPtkp(form.ptkp));

const calculate = () => {
  submitted.value = true;
  events.calculate(mode.value === 'tahun' ? 'tahunan' : 'bulanan');
};

const shareState = computed(() => ({ ...form, mode: mode.value }));

const faqs = [
  {
    q: 'Apa itu PPh 21 skema TER?',
    a: 'Sejak 2024, PPh 21 karyawan tetap untuk Januari sampai November dipotong dengan tarif efektif rata-rata (TER) dikali penghasilan bruto bulan itu. Kategori TER A, B, atau C ditentukan dari status PTKP.',
  },
  {
    q: 'Kenapa potongan PPh 21 bulan Desember bisa jauh berbeda?',
    a: 'Di Desember, PPh 21 setahun dihitung ulang dengan tarif Pasal 17 setelah dikurangi biaya jabatan, iuran JHT dan JP, serta PTKP. Hasilnya dikurangi PPh yang sudah dipotong Januari sampai November, sehingga bisa kurang bayar (potongan lebih besar) atau lebih bayar (dikembalikan).',
  },
  {
    q: 'Kenapa iuran BPJS yang dibayar perusahaan ikut menambah penghasilan bruto?',
    a: 'Premi BPJS Kesehatan (4%), JKK, dan JKM yang dibayar pemberi kerja termasuk penghasilan karyawan untuk PPh 21. Iuran JHT dan JP bagian perusahaan tidak termasuk.',
  },
  {
    q: 'Bagaimana THR dipotong pajaknya?',
    a: 'THR ditambahkan ke penghasilan bruto bulan dibayarkannya, sehingga tarif TER bulan itu naik. Selisihnya dikoreksi di Desember.',
  },
  {
    q: 'Apakah data gaji saya disimpan?',
    a: 'Tidak. Semua hitungan berjalan di browsermu. Link berbagi menyimpan angka di bagian setelah tanda # yang tidak pernah dikirim ke server.',
  },
];

const howTo = [
  'Isi gaji pokok, tunjangan tetap, dan tunjangan tidak tetap per bulan.',
  'Pilih status PTKP (TK/0 sampai K/3) dan centang keikutsertaan BPJS Kesehatan serta Ketenagakerjaan.',
  'Pilih bulan yang ingin dihitung. Bila ada THR atau bonus, isi nominal dan bulan dibayarnya.',
  "Tekan 'Hitung gaji bersih' untuk melihat take home pay, rincian potongan, dan tarif TER yang dipakai.",
  "Pilih tampilan 'Setahun' untuk melihat potongan tiap bulan dan rekonsiliasi PPh 21 di bulan Desember.",
];
</script>

<template>
  <ToolShell
    :how-to="howTo"
    :slug="SLUG"
    title="Kalkulator Gaji Bersih 2026"
    seo-title="Kalkulator Gaji Bersih PPh 21 TER dan BPJS 2026"
    description="Hitung take home pay, potongan BPJS, dan PPh 21 skema TER (PMK 168/2023), lengkap dengan rekonsiliasi Desember dan THR."
    :faqs="faqs"
    :sources="rules.sources"
    :checked-at="rules.checkedAt"
    :caveats="rules.caveats"
  >
    <form class="card space-y-5" @submit.prevent="calculate">
      <div class="grid gap-4 sm:grid-cols-2">
        <RupiahInput
          id="gaji-pokok"
          v-model="form.gajiPokok"
          label="Gaji pokok per bulan"
        />
        <RupiahInput
          id="tunjangan-tetap"
          v-model="form.tunjanganTetap"
          label="Tunjangan tetap per bulan"
          hint="Ikut jadi dasar iuran BPJS."
        />
        <RupiahInput
          id="tunjangan-tidak-tetap"
          v-model="form.tunjanganTidakTetap"
          label="Tunjangan tidak tetap (opsional)"
          hint="Mis. lembur atau uang makan yang berubah tiap bulan."
        />
        <div>
          <label for="ptkp" class="field-label">Status PTKP</label>
          <select id="ptkp" v-model="form.ptkp" class="field-input">
            <option
              v-for="status in PTKP_STATUSES"
              :key="status"
              :value="status"
            >
              {{ status }} ({{ formatRupiah(getPtkp(status)) }}/tahun)
            </option>
          </select>
          <p class="field-hint">
            TK = tidak kawin, K = kawin, angka = jumlah tanggungan.
          </p>
        </div>
      </div>

      <fieldset class="grid gap-4 sm:grid-cols-2">
        <legend class="field-label">BPJS</legend>
        <label class="flex items-center gap-2 text-sm">
          <input
            v-model="form.ikutBpjsKesehatan"
            type="checkbox"
            class="h-4 w-4 accent-primary"
          />
          Ikut BPJS Kesehatan
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input
            v-model="form.ikutBpjsKetenagakerjaan"
            type="checkbox"
            class="h-4 w-4 accent-primary"
          />
          Ikut BPJS Ketenagakerjaan
        </label>
        <div v-if="form.ikutBpjsKetenagakerjaan" class="sm:col-span-2">
          <label for="jkk" class="field-label"
            >Tingkat risiko kerja (JKK)</label
          >
          <select
            id="jkk"
            v-model.number="form.jkkRiskIndex"
            class="field-input"
          >
            <option
              v-for="(risk, index) in rules.jkkRates"
              :key="risk.label"
              :value="index"
            >
              {{ risk.label }}
            </option>
          </select>
        </div>
      </fieldset>

      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label for="bulan" class="field-label">Bulan</label>
          <select id="bulan" v-model.number="form.month" class="field-input">
            <option
              v-for="(name, index) in MONTH_NAMES"
              :key="name"
              :value="index + 1"
            >
              {{ name }}
            </option>
          </select>
        </div>
        <RupiahInput
          id="thr"
          v-model="form.thr"
          label="THR atau bonus (opsional)"
        />
        <div>
          <label for="thr-bulan" class="field-label">Dibayar bulan</label>
          <select
            id="thr-bulan"
            v-model.number="form.thrMonth"
            class="field-input"
          >
            <option
              v-for="(name, index) in MONTH_NAMES"
              :key="name"
              :value="index + 1"
            >
              {{ name }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          class="btn-primary"
          :disabled="form.gajiPokok <= 0"
        >
          Hitung gaji bersih
        </button>
        <div class="seg" role="group" aria-label="Tampilan">
          <button
            type="button"
            :aria-pressed="mode === 'bulan'"
            @click="mode = 'bulan'"
          >
            Per bulan
          </button>
          <button
            type="button"
            :aria-pressed="mode === 'tahun'"
            @click="mode = 'tahun'"
          >
            Setahun
          </button>
        </div>
      </div>
    </form>

    <template v-if="submitted && form.gajiPokok > 0">
      <section
        v-if="mode === 'bulan'"
        class="card space-y-5"
        aria-live="polite"
      >
        <div>
          <p class="text-sm text-slate-500">
            Gaji bersih diterima bulan {{ MONTH_NAMES[form.month - 1] }}
          </p>
          <p class="tabular text-3xl font-bold text-primary">
            {{ formatRupiah(month.takeHomePay) }}
          </p>
          <p class="mt-1 text-sm text-slate-600">
            <template v-if="month.terRate !== null">
              PPh 21 memakai TER kategori {{ month.terCategory }} tarif
              {{ formatPercent(month.terRate) }}.
            </template>
            <template v-else>
              Desember memakai rekonsiliasi tarif Pasal 17 (<button
                type="button"
                class="btn-link"
                @click="mode = 'tahun'"
              >
                lihat setahun</button
              >).
            </template>
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <h2 class="font-semibold">Potongan dari gajimu</h2>
            <div class="mt-2 tabular">
              <p class="result-row">
                <span>Penghasilan (gaji + tunjangan + THR)</span
                ><span>{{ formatRupiah(month.cashIncome) }}</span>
              </p>
              <p class="result-row">
                <span>BPJS Kesehatan (1%)</span
                ><span>-{{ formatRupiah(month.employee.kesehatan) }}</span>
              </p>
              <p class="result-row">
                <span>JHT (2%)</span
                ><span>-{{ formatRupiah(month.employee.jht) }}</span>
              </p>
              <p class="result-row">
                <span>Jaminan Pensiun (1%)</span
                ><span>-{{ formatRupiah(month.employee.jp) }}</span>
              </p>
              <p class="result-row">
                <span>PPh 21</span>
                <span>{{
                  month.pph21 < 0
                    ? '+' + formatRupiah(-month.pph21) + ' (dikembalikan)'
                    : '-' + formatRupiah(month.pph21)
                }}</span>
              </p>
              <p class="result-row font-semibold">
                <span>Gaji bersih</span
                ><span>{{ formatRupiah(month.takeHomePay) }}</span>
              </p>
            </div>
          </div>
          <div>
            <h2 class="font-semibold">Dibayar perusahaan di luar gajimu</h2>
            <div class="mt-2 tabular">
              <p class="result-row">
                <span>BPJS Kesehatan (4%)</span
                ><span>{{ formatRupiah(month.employer.kesehatan) }}</span>
              </p>
              <p class="result-row">
                <span>JHT (3,7%)</span
                ><span>{{ formatRupiah(month.employer.jht) }}</span>
              </p>
              <p class="result-row">
                <span>Jaminan Pensiun (2%)</span
                ><span>{{ formatRupiah(month.employer.jp) }}</span>
              </p>
              <p class="result-row">
                <span>JKK</span
                ><span>{{ formatRupiah(month.employer.jkk) }}</span>
              </p>
              <p class="result-row">
                <span>JKM (0,3%)</span
                ><span>{{ formatRupiah(month.employer.jkm) }}</span>
              </p>
              <p class="result-row font-semibold">
                <span>Total biaya perusahaan</span
                ><span>{{ formatRupiah(month.employerCost) }}</span>
              </p>
            </div>
          </div>
        </div>

        <details class="rounded-xl bg-slate-50 p-4 text-sm">
          <summary class="cursor-pointer font-semibold">
            Cara hitung dengan angkamu
          </summary>
          <ol class="mt-3 list-decimal space-y-2 pl-5 text-slate-700">
            <li>
              Dasar BPJS = gaji pokok + tunjangan tetap =
              {{ formatRupiah(form.gajiPokok + form.tunjanganTetap) }}. BPJS
              Kesehatan dihitung maksimal dari
              {{ formatRupiah(rules.bpjs.kesehatan.wageCap) }}, Jaminan Pensiun
              maksimal dari {{ formatRupiah(rules.bpjs.jp.wageCap) }}.
            </li>
            <li>
              Penghasilan bruto untuk PPh 21 = penghasilan
              {{ formatRupiah(month.cashIncome) }} + premi yang dibayar
              perusahaan (BPJS Kesehatan, JKK, JKM)
              {{
                formatRupiah(
                  month.employer.kesehatan +
                    month.employer.jkk +
                    month.employer.jkm,
                )
              }}
              = {{ formatRupiah(month.bruto) }}.
            </li>
            <li v-if="month.terRate !== null">
              Status {{ form.ptkp }} masuk TER kategori {{ month.terCategory }}.
              Bruto {{ formatRupiah(month.bruto) }} kena tarif
              {{ formatPercent(month.terRate) }}, jadi PPh 21 =
              {{ formatRupiah(month.pph21) }}.
            </li>
            <li v-else>
              Desember: PPh 21 setahun
              {{ formatRupiah(year.december.pph21Setahun) }}
              dikurangi yang sudah dipotong Januari sampai November
              {{ formatRupiah(year.december.pph21JanNov) }} =
              {{ formatRupiah(year.december.pph21Desember) }}.
            </li>
            <li>
              Gaji bersih = penghasilan - iuran BPJS bagianmu - PPh 21 =
              {{ formatRupiah(month.takeHomePay) }}.
            </li>
          </ol>
        </details>
      </section>

      <section v-else class="card space-y-5" aria-live="polite">
        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <p class="text-sm text-slate-500">Gaji bersih setahun</p>
            <p class="tabular text-2xl font-bold text-primary">
              {{ formatRupiah(year.totals.takeHomePay) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-slate-500">PPh 21 setahun</p>
            <p class="tabular text-2xl font-bold">
              {{ formatRupiah(year.totals.pph21) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-slate-500">PPh 21 Desember</p>
            <p class="tabular text-2xl font-bold">
              {{ formatRupiah(year.december.pph21Desember) }}
            </p>
            <p class="text-xs text-slate-500">
              {{
                year.december.pph21Desember < 0
                  ? 'Lebih bayar, dikembalikan di Desember.'
                  : 'Sisa pajak setahun yang dipotong di Desember.'
              }}
            </p>
          </div>
        </div>

        <div class="-mx-4 overflow-x-auto sm:mx-0">
          <table class="tabular w-full min-w-[560px] text-sm">
            <thead class="text-left text-slate-500">
              <tr>
                <th class="px-4 py-2 font-medium sm:px-2">Bulan</th>
                <th class="px-2 py-2 text-right font-medium">Bruto</th>
                <th class="px-2 py-2 text-right font-medium">Tarif</th>
                <th class="px-2 py-2 text-right font-medium">PPh 21</th>
                <th class="px-4 py-2 text-right font-medium sm:px-2">
                  Gaji bersih
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in year.months"
                :key="row.month"
                class="border-t border-slate-100"
                :class="row.month === 12 ? 'bg-amber-50' : ''"
              >
                <td class="px-4 py-2 sm:px-2">
                  {{ MONTH_NAMES[row.month - 1] }}
                </td>
                <td class="px-2 py-2 text-right">
                  {{ formatRupiah(row.bruto) }}
                </td>
                <td class="px-2 py-2 text-right">
                  {{
                    row.terRate === null
                      ? 'Pasal 17'
                      : formatPercent(row.terRate)
                  }}
                </td>
                <td class="px-2 py-2 text-right">
                  {{ formatRupiah(row.pph21) }}
                </td>
                <td class="px-4 py-2 text-right font-medium sm:px-2">
                  {{ formatRupiah(row.takeHomePay) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <details class="rounded-xl bg-slate-50 p-4 text-sm" open>
          <summary class="cursor-pointer font-semibold">
            Rekonsiliasi Desember
          </summary>
          <div class="mt-3 tabular">
            <p class="result-row">
              <span>Penghasilan bruto setahun</span
              ><span>{{ formatRupiah(year.december.brutoSetahun) }}</span>
            </p>
            <p class="result-row">
              <span>Biaya jabatan (5%, maks Rp6 juta)</span
              ><span>-{{ formatRupiah(year.december.biayaJabatan) }}</span>
            </p>
            <p class="result-row">
              <span>Iuran JHT dan JP bagianmu</span
              ><span>-{{ formatRupiah(year.december.iuranPensiun) }}</span>
            </p>
            <p class="result-row">
              <span>Penghasilan neto</span
              ><span>{{ formatRupiah(year.december.neto) }}</span>
            </p>
            <p class="result-row">
              <span>PTKP {{ form.ptkp }}</span
              ><span>-{{ formatRupiah(ptkpValue) }}</span>
            </p>
            <p class="result-row">
              <span>Penghasilan kena pajak (dibulatkan ke ribuan)</span
              ><span>{{ formatRupiah(year.december.pkp) }}</span>
            </p>
            <p class="result-row">
              <span>PPh 21 setahun (tarif Pasal 17)</span
              ><span>{{ formatRupiah(year.december.pph21Setahun) }}</span>
            </p>
            <p class="result-row">
              <span>Sudah dipotong Januari sampai November</span
              ><span>-{{ formatRupiah(year.december.pph21JanNov) }}</span>
            </p>
            <p class="result-row font-semibold">
              <span>PPh 21 Desember</span
              ><span>{{ formatRupiah(year.december.pph21Desember) }}</span>
            </p>
          </div>
        </details>
      </section>

      <div class="flex flex-wrap items-center gap-3">
        <ShareButton
          :tool-id="SLUG"
          :state="shareState"
          title="Hasil kalkulator gaji bersih"
        />
      </div>
      <DonationCta placement="after-result" :slug="SLUG" />
      <AdSlot placement="result" :slug="SLUG" />
    </template>
  </ToolShell>
</template>
