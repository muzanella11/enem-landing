<script setup lang="ts">
import { formatRupiah } from '~/utils/format';
import { bytesToBlob, downloadBlob } from '~/utils/browser-files';
import { formatDocumentNumber, METERAI, needsMeterai } from '~/utils/invoice';
import type { ReceiptDocument } from '~/utils/invoice/storage';
import { terbilang } from '~/utils/terbilang';

const SLUG = 'buat-kwitansi';
const events = useToolEvents(SLUG);
const { store, loaded } = useInvoiceStore();

const newDraft = (): ReceiptDocument => ({
  id: crypto.randomUUID(),
  number: '',
  receivedFrom: '',
  amount: 0,
  purpose: '',
  place: '',
  date: new Date().toISOString().slice(0, 10),
  receiverName: store.value.profile.name,
  createdAt: new Date().toISOString(),
});

const draft = ref<ReceiptDocument>(newDraft());
const selected = ref<string[]>([]);
const perPage = ref<1 | 2 | 3>(3);
const busy = ref(false);

watch(loaded, (isLoaded) => {
  if (isLoaded && !draft.value.receiverName)
    draft.value.receiverName = store.value.profile.name;
});

const previewNumber = computed(
  () =>
    draft.value.number ||
    formatDocumentNumber(
      store.value.profile.receiptPattern,
      store.value.profile.nextReceiptSequence,
      new Date(draft.value.date),
    ),
);

const save = () => {
  if (!draft.value.number) {
    draft.value.number = previewNumber.value;
    store.value.profile.nextReceiptSequence += 1;
  }
  const copy = JSON.parse(JSON.stringify(draft.value)) as ReceiptDocument;
  const index = store.value.receipts.findIndex(
    (receipt) => receipt.id === copy.id,
  );
  if (index >= 0) store.value.receipts[index] = copy;
  else store.value.receipts.unshift(copy);
  if (!selected.value.includes(copy.id)) selected.value.push(copy.id);
  draft.value = {
    ...newDraft(),
    place: copy.place,
    receiverName: copy.receiverName,
  };
};

const render = async (receipts: ReceiptDocument[], name: string) => {
  busy.value = true;
  try {
    const { renderReceiptsPdf } = await import('~/utils/invoice/pdf');
    const bytes = await renderReceiptsPdf(
      receipts,
      perPage.value,
      store.value.profile.showFooterCredit,
    );
    downloadBlob(bytesToBlob(bytes, 'application/pdf'), name);
    events.download('pdf');
    events.calculate(`${perPage.value}-per-halaman`);
  } finally {
    busy.value = false;
  }
};

const saveAndDownload = async () => {
  save();
  const latest = store.value.receipts[0];
  if (latest)
    await render([latest], `${latest.number.replace(/[^\w-]+/g, '-')}.pdf`);
};

const downloadSelected = () =>
  render(
    store.value.receipts.filter((receipt) =>
      selected.value.includes(receipt.id),
    ),
    'kwitansi.pdf',
  );

const removeReceipt = (id: string) => {
  store.value.receipts = store.value.receipts.filter(
    (receipt) => receipt.id !== id,
  );
  selected.value = selected.value.filter((item) => item !== id);
};

const faqs = [
  {
    q: 'Kapan kwitansi perlu meterai?',
    a: `Dokumen yang menyebut nominal di atas ${formatRupiah(METERAI.threshold)} dikenai bea meterai ${formatRupiah(METERAI.amount)} (UU 10/2020). Kwitansi ini hanya menandai tempat meterai; tempel meterai atau bubuhkan e-meterai sendiri.`,
  },
  {
    q: 'Bisa mencetak beberapa kwitansi dalam satu kertas?',
    a: 'Bisa. Simpan beberapa kwitansi, centang yang mau dicetak, lalu pilih 1, 2, atau 3 kwitansi per halaman A4.',
  },
];

const howTo = [
  'Isi nama pemberi uang, jumlah uang, dan keperluan pembayaran. Terbilang dibuat otomatis.',
  'Isi tempat, tanggal, dan nama penerima.',
  "Tekan 'Simpan dan unduh PDF', atau simpan beberapa kwitansi lalu cetak hingga tiga per halaman A4.",
];
</script>

<template>
  <ToolShell
    :how-to="howTo"
    :slug="SLUG"
    title="Buat Kwitansi"
    seo-title="Buat Kwitansi PDF dengan Terbilang Otomatis"
    description="Buat kwitansi PDF lengkap dengan terbilang otomatis dan penanda meterai, bisa beberapa kwitansi per halaman A4. Data tersimpan di perangkatmu."
    application-category="BusinessApplication"
    :faqs="faqs"
  >
    <ClientOnly>
      <form class="card space-y-4" @submit.prevent="saveAndDownload">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <span class="field-label">Nomor</span>
            <p class="field-input bg-slate-50 text-sm">{{ previewNumber }}</p>
          </div>
          <div>
            <label for="kw-tanggal" class="field-label">Tanggal</label>
            <input
              id="kw-tanggal"
              v-model="draft.date"
              type="date"
              class="field-input"
            />
          </div>
          <div class="sm:col-span-2">
            <label for="kw-dari" class="field-label">Telah terima dari</label>
            <input
              id="kw-dari"
              v-model="draft.receivedFrom"
              class="field-input"
            />
          </div>
          <RupiahInput
            id="kw-jumlah"
            v-model="draft.amount"
            label="Uang sejumlah"
          />
          <div>
            <span class="field-label">Terbilang</span>
            <p class="rounded-lg bg-slate-50 px-3 py-2 text-sm italic">
              {{
                draft.amount
                  ? terbilang(draft.amount, { titleCase: true })
                  : '-'
              }}
            </p>
          </div>
          <div class="sm:col-span-2">
            <label for="kw-untuk" class="field-label">Untuk pembayaran</label>
            <input id="kw-untuk" v-model="draft.purpose" class="field-input" />
          </div>
          <div>
            <label for="kw-tempat" class="field-label">Tempat</label>
            <input
              id="kw-tempat"
              v-model="draft.place"
              class="field-input"
              placeholder="Kota"
            />
          </div>
          <div>
            <label for="kw-penerima" class="field-label">Nama penerima</label>
            <input
              id="kw-penerima"
              v-model="draft.receiverName"
              class="field-input"
            />
          </div>
        </div>
        <p
          v-if="needsMeterai(draft.amount)"
          class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
        >
          Nominal di atas {{ formatRupiah(METERAI.threshold) }}: kwitansi akan
          diberi kotak penanda meterai {{ formatRupiah(METERAI.amount) }}.
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="submit"
            class="btn-primary"
            :disabled="busy || draft.amount <= 0"
          >
            Simpan dan unduh PDF
          </button>
          <button
            type="button"
            class="btn-secondary"
            :disabled="draft.amount <= 0"
            @click="save"
          >
            Simpan saja
          </button>
        </div>
      </form>

      <section
        v-if="loaded && store.receipts.length > 0"
        class="card space-y-4"
      >
        <h2 class="font-semibold">Kwitansi tersimpan</h2>
        <ul class="divide-y divide-slate-100 text-sm">
          <li
            v-for="receipt in store.receipts"
            :key="receipt.id"
            class="flex items-center gap-3 py-2"
          >
            <input
              v-model="selected"
              type="checkbox"
              :value="receipt.id"
              class="h-4 w-4 accent-teal-700"
              :aria-label="`Pilih ${receipt.number}`"
            />
            <span class="min-w-0 flex-1 truncate"
              >{{ receipt.number }} · {{ receipt.receivedFrom || '-' }} ·
              {{ formatRupiah(receipt.amount) }}</span
            >
            <button
              type="button"
              class="text-rose-700 hover:underline"
              @click="removeReceipt(receipt.id)"
            >
              Hapus
            </button>
          </li>
        </ul>
        <div class="flex flex-wrap items-center gap-3">
          <label for="per-halaman" class="text-sm">Per halaman A4</label>
          <select
            id="per-halaman"
            v-model.number="perPage"
            class="field-input w-24"
          >
            <option :value="1">1</option>
            <option :value="2">2</option>
            <option :value="3">3</option>
          </select>
          <button
            type="button"
            class="btn-primary"
            :disabled="busy || selected.length === 0"
            @click="downloadSelected"
          >
            Unduh {{ selected.length }} kwitansi
          </button>
        </div>
        <InvoiceDataTools />
        <DonationCta placement="history" :slug="SLUG" />
      </section>
    </ClientOnly>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
