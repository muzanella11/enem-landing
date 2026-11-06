<script setup lang="ts">
import { formatRupiah } from '~/utils/format';
import { bytesToBlob, downloadBlob } from '~/utils/browser-files';
import { calculateInvoiceTotals, formatDocumentNumber } from '~/utils/invoice';
import type { InvoiceDocument, InvoiceStatus } from '~/utils/invoice/storage';
import { terbilang } from '~/utils/terbilang';

const SLUG = 'buat-invoice';
const events = useToolEvents(SLUG);
const { store, loaded } = useInvoiceStore();
const tab = ref<'buat' | 'riwayat' | 'profil'>('buat');

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

const newDraft = (): InvoiceDocument => ({
  id: crypto.randomUUID(),
  number: '',
  issueDate: today(),
  dueDate: plusDays(14),
  customer: { name: '', address: '', contact: '' },
  items: [{ description: '', qty: 1, unit: 'pcs', price: 0, discountPct: 0 }],
  discountPct: 0,
  taxes: [],
  shipping: 0,
  notes: '',
  terms: 'Pembayaran paling lambat pada tanggal jatuh tempo.',
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const draft = ref<InvoiceDocument>(newDraft());
const isSaved = computed(() =>
  store.value.invoices.some((invoice) => invoice.id === draft.value.id),
);
const previewNumber = computed(
  () =>
    draft.value.number ||
    formatDocumentNumber(
      store.value.profile.invoicePattern,
      store.value.profile.nextInvoiceSequence,
      new Date(draft.value.issueDate),
    ),
);
const totals = computed(() => calculateInvoiceTotals(draft.value));
const busy = ref(false);
const message = ref('');

const addItem = () =>
  draft.value.items.push({
    description: '',
    qty: 1,
    unit: 'pcs',
    price: 0,
    discountPct: 0,
  });
const removeItem = (index: number) => draft.value.items.splice(index, 1);
const addTax = (kind: 'add' | 'withhold') =>
  draft.value.taxes.push(
    kind === 'add'
      ? { label: 'PPN', ratePct: 11, kind }
      : { label: 'PPh 23', ratePct: 2, kind },
  );

/** Assigns the number on first save and advances the local counter. */
const save = () => {
  if (!draft.value.number) {
    draft.value.number = previewNumber.value;
    store.value.profile.nextInvoiceSequence += 1;
  }
  draft.value.updatedAt = new Date().toISOString();
  const copy = JSON.parse(JSON.stringify(draft.value)) as InvoiceDocument;
  const index = store.value.invoices.findIndex(
    (invoice) => invoice.id === copy.id,
  );
  if (index >= 0) store.value.invoices[index] = copy;
  else store.value.invoices.unshift(copy);
  message.value = 'Invoice tersimpan di browser ini.';
};

const download = async (invoice: InvoiceDocument = draft.value) => {
  busy.value = true;
  try {
    if (invoice === draft.value) save();
    const { renderInvoicePdf } = await import('~/utils/invoice/pdf');
    const bytes = await renderInvoicePdf(store.value.profile, invoice);
    downloadBlob(
      bytesToBlob(bytes, 'application/pdf'),
      `${invoice.number.replace(/[^\w-]+/g, '-')}.pdf`,
    );
    events.download('pdf');
    events.calculate(store.value.profile.template);
  } finally {
    busy.value = false;
  }
};

const share = async () => {
  if (!navigator.share) return;
  const { renderInvoicePdf } = await import('~/utils/invoice/pdf');
  save();
  const bytes = await renderInvoicePdf(store.value.profile, draft.value);
  const file = new File(
    [bytes as BlobPart],
    `${draft.value.number.replace(/[^\w-]+/g, '-')}.pdf`,
    { type: 'application/pdf' },
  );
  if (navigator.canShare?.({ files: [file] })) {
    await navigator
      .share({ files: [file], title: `Invoice ${draft.value.number}` })
      .catch(() => undefined);
    events.share();
  }
};
const canShareFiles = ref(false);
onMounted(() => {
  canShareFiles.value = typeof navigator.canShare === 'function';
});

const edit = (invoice: InvoiceDocument) => {
  draft.value = JSON.parse(JSON.stringify(invoice));
  tab.value = 'buat';
  message.value = '';
};
const duplicate = (invoice: InvoiceDocument) => {
  draft.value = {
    ...JSON.parse(JSON.stringify(invoice)),
    id: crypto.randomUUID(),
    number: '',
    status: 'draft',
    issueDate: today(),
    dueDate: plusDays(14),
    createdAt: new Date().toISOString(),
  };
  tab.value = 'buat';
  message.value = 'Salinan dibuat. Nomor baru diberikan saat disimpan.';
};
const setStatus = (invoice: InvoiceDocument, status: InvoiceStatus) => {
  invoice.status = status;
  invoice.updatedAt = new Date().toISOString();
};
const removeInvoice = (id: string) => {
  store.value.invoices = store.value.invoices.filter(
    (invoice) => invoice.id !== id,
  );
};
const startNew = () => {
  draft.value = newDraft();
  message.value = '';
};

const faqs = [
  {
    q: 'Apakah invoice ini bisa dipakai sebagai e-Faktur?',
    a: 'Tidak. Tool ini membuat invoice komersial biasa. Baris PPN atau PPh bersifat opsional dan tarifnya kamu isi sendiri; e-Faktur tetap dibuat lewat sistem DJP.',
  },
  {
    q: 'Di mana data invoice saya disimpan?',
    a: 'Hanya di browser ini (localStorage). Tidak ada akun dan tidak ada server. Gunakan tombol Ekspor untuk cadangan atau pindah perangkat.',
  },
  {
    q: 'Bisakah menambahkan QRIS di invoice?',
    a: 'Bisa. Unggah gambar QRIS di tab Profil usaha; gambar diproses di browser dan dicetak di bagian pembayaran.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Buat Invoice"
    seo-title="Buat Invoice PDF Gratis untuk UMKM dan Freelancer"
    description="Buat invoice PDF rapi dengan logo, QRIS, diskon, pajak opsional, dan terbilang. Tanpa akun, data tersimpan di perangkatmu."
    application-category="BusinessApplication"
    :faqs="faqs"
    wide
  >
    <div class="seg" role="tablist">
      <button
        type="button"
        role="tab"
        :aria-pressed="tab === 'buat'"
        @click="tab = 'buat'"
      >
        Buat invoice
      </button>
      <button
        type="button"
        role="tab"
        :aria-pressed="tab === 'riwayat'"
        @click="tab = 'riwayat'"
      >
        Riwayat ({{ store.invoices.length }})
      </button>
      <button
        type="button"
        role="tab"
        :aria-pressed="tab === 'profil'"
        @click="tab = 'profil'"
      >
        Profil usaha
      </button>
    </div>

    <ClientOnly>
      <template v-if="loaded">
        <!-- Editor -->
        <div v-if="tab === 'buat'" class="grid gap-6 xl:grid-cols-2">
          <form class="card space-y-5" @submit.prevent="download()">
            <p
              v-if="!store.profile.name"
              class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
            >
              Isi dulu
              <button type="button" class="btn-link" @click="tab = 'profil'">
                profil usaha
              </button>
              (nama, rekening, logo) supaya muncul di invoice.
            </p>
            <div class="grid gap-4 sm:grid-cols-3">
              <div>
                <span class="field-label">Nomor</span>
                <p class="field-input bg-slate-50 text-sm">
                  {{ previewNumber }}
                </p>
              </div>
              <div>
                <label for="tgl" class="field-label">Tanggal</label>
                <input
                  id="tgl"
                  v-model="draft.issueDate"
                  type="date"
                  class="field-input"
                />
              </div>
              <div>
                <label for="jatuh-tempo" class="field-label">Jatuh tempo</label>
                <input
                  id="jatuh-tempo"
                  v-model="draft.dueDate"
                  type="date"
                  class="field-input"
                />
              </div>
            </div>

            <fieldset class="grid gap-4 sm:grid-cols-2">
              <legend class="field-label">Pelanggan</legend>
              <input
                v-model="draft.customer.name"
                class="field-input"
                placeholder="Nama pelanggan"
                aria-label="Nama pelanggan"
              />
              <input
                v-model="draft.customer.contact"
                class="field-input"
                placeholder="Email/telepon"
                aria-label="Kontak pelanggan"
              />
              <textarea
                v-model="draft.customer.address"
                rows="2"
                class="field-input sm:col-span-2"
                placeholder="Alamat"
                aria-label="Alamat pelanggan"
              />
            </fieldset>

            <fieldset class="space-y-3">
              <legend class="field-label">Item</legend>
              <div
                v-for="(item, index) in draft.items"
                :key="index"
                class="grid grid-cols-6 gap-2 rounded-xl border border-slate-200 p-3"
              >
                <input
                  v-model="item.description"
                  class="field-input col-span-6"
                  placeholder="Deskripsi"
                  :aria-label="`Deskripsi item ${index + 1}`"
                />
                <input
                  v-model.number="item.qty"
                  type="number"
                  min="0"
                  step="any"
                  class="field-input col-span-2 sm:col-span-1"
                  :aria-label="`Qty item ${index + 1}`"
                />
                <input
                  v-model="item.unit"
                  class="field-input col-span-2 sm:col-span-1"
                  placeholder="Satuan"
                  :aria-label="`Satuan item ${index + 1}`"
                />
                <RupiahInput
                  :id="`harga-${index}`"
                  v-model="item.price"
                  label="Harga satuan"
                  hide-label
                  class="col-span-6 sm:col-span-2"
                />
                <div class="col-span-4 flex items-center gap-1 sm:col-span-1">
                  <input
                    v-model.number="item.discountPct"
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    class="field-input"
                    :aria-label="`Diskon item ${index + 1} persen`"
                  />
                  <span class="text-sm text-slate-500">%</span>
                </div>
                <button
                  type="button"
                  class="col-span-2 text-sm text-rose-700 sm:col-span-1"
                  :disabled="draft.items.length === 1"
                  @click="removeItem(index)"
                >
                  Hapus
                </button>
              </div>
              <button type="button" class="btn-secondary" @click="addItem">
                Tambah item
              </button>
            </fieldset>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="diskon" class="field-label"
                  >Diskon seluruh invoice (%)</label
                >
                <input
                  id="diskon"
                  v-model.number="draft.discountPct"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  class="field-input"
                />
              </div>
              <RupiahInput
                id="ongkir"
                v-model="draft.shipping"
                label="Ongkos kirim"
              />
            </div>

            <fieldset class="space-y-2">
              <legend class="field-label">Pajak (opsional)</legend>
              <div
                v-for="(tax, index) in draft.taxes"
                :key="index"
                class="flex flex-wrap items-center gap-2"
              >
                <input
                  v-model="tax.label"
                  class="field-input w-32"
                  aria-label="Nama pajak"
                />
                <input
                  v-model.number="tax.ratePct"
                  type="number"
                  min="0"
                  step="any"
                  class="field-input w-24"
                  aria-label="Tarif pajak persen"
                />
                <span class="text-sm text-slate-500"
                  >%
                  {{
                    tax.kind === 'add' ? 'ditambahkan' : 'dipotong pembeli'
                  }}</span
                >
                <button
                  type="button"
                  class="text-sm text-rose-700"
                  @click="draft.taxes.splice(index, 1)"
                >
                  Hapus
                </button>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn-secondary"
                  @click="addTax('add')"
                >
                  + Pajak ditambahkan (mis. PPN)
                </button>
                <button
                  type="button"
                  class="btn-secondary"
                  @click="addTax('withhold')"
                >
                  + Pajak dipotong (mis. PPh 23)
                </button>
              </div>
              <p class="field-hint">
                Tarif diisi sendiri sesuai kondisi usahamu. Ini bukan e-Faktur.
              </p>
            </fieldset>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="catatan" class="field-label">Catatan</label>
                <textarea
                  id="catatan"
                  v-model="draft.notes"
                  rows="2"
                  class="field-input"
                />
              </div>
              <div>
                <label for="syarat" class="field-label"
                  >Syarat pembayaran</label
                >
                <textarea
                  id="syarat"
                  v-model="draft.terms"
                  rows="2"
                  class="field-input"
                />
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <button type="submit" class="btn-primary" :disabled="busy">
                {{ busy ? 'Menyiapkan PDF...' : 'Simpan dan unduh PDF' }}
              </button>
              <button type="button" class="btn-secondary" @click="save">
                Simpan
              </button>
              <button
                v-if="canShareFiles"
                type="button"
                class="btn-secondary"
                @click="share"
              >
                Bagikan PDF
              </button>
              <button
                v-if="isSaved"
                type="button"
                class="btn-secondary"
                @click="startNew"
              >
                Invoice baru
              </button>
            </div>
            <p v-if="message" class="text-sm text-teal-700">{{ message }}</p>
          </form>

          <!-- Live preview (the PDF itself is drawn with pdf-lib on download) -->
          <section
            class="card space-y-4 text-sm"
            aria-label="Pratinjau invoice"
          >
            <div
              class="flex items-start justify-between gap-4"
              :class="
                store.profile.template === 'modern'
                  ? 'border-t-4 border-teal-700 pt-3'
                  : ''
              "
            >
              <div class="flex items-start gap-3">
                <img
                  v-if="store.profile.logoDataUrl"
                  :src="store.profile.logoDataUrl"
                  alt=""
                  class="h-12 w-auto"
                />
                <div>
                  <p class="font-bold">
                    {{ store.profile.name || 'Nama usaha' }}
                  </p>
                  <p class="whitespace-pre-line text-xs text-slate-500">
                    {{ store.profile.address }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p
                  class="text-xl font-bold"
                  :class="
                    store.profile.template === 'modern' ? 'text-teal-700' : ''
                  "
                >
                  INVOICE
                </p>
                <p class="text-xs">{{ previewNumber }}</p>
                <p
                  v-if="draft.status === 'lunas'"
                  class="text-xs font-bold text-teal-700"
                >
                  LUNAS
                </p>
              </div>
            </div>
            <div>
              <p class="text-xs text-slate-500">Ditagihkan kepada</p>
              <p class="font-semibold">{{ draft.customer.name || '-' }}</p>
            </div>
            <table class="tabular w-full text-xs">
              <thead
                :class="
                  store.profile.template === 'modern'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100'
                "
              >
                <tr>
                  <th class="p-1 text-left">Deskripsi</th>
                  <th class="p-1 text-right">Qty</th>
                  <th class="p-1 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in draft.items"
                  :key="index"
                  class="border-b border-slate-100"
                >
                  <td class="p-1">{{ item.description || '-' }}</td>
                  <td class="p-1 text-right">{{ item.qty }} {{ item.unit }}</td>
                  <td class="p-1 text-right">
                    {{ formatRupiah(totals.lines[index]?.net ?? 0) }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="tabular ml-auto max-w-xs">
              <p class="result-row">
                <span>Subtotal</span
                ><span>{{ formatRupiah(totals.subtotal) }}</span>
              </p>
              <p v-if="totals.invoiceDiscount" class="result-row">
                <span>Diskon</span
                ><span>-{{ formatRupiah(totals.invoiceDiscount) }}</span>
              </p>
              <p
                v-for="tax in totals.taxes"
                :key="tax.label"
                class="result-row"
              >
                <span>{{ tax.label }} ({{ tax.ratePct }}%)</span
                ><span
                  >{{ tax.kind === 'withhold' ? '-' : ''
                  }}{{ formatRupiah(tax.amount) }}</span
                >
              </p>
              <p v-if="totals.shipping" class="result-row">
                <span>Ongkir</span
                ><span>{{ formatRupiah(totals.shipping) }}</span>
              </p>
              <p class="result-row font-bold">
                <span>Total</span><span>{{ formatRupiah(totals.total) }}</span>
              </p>
            </div>
            <p class="text-right text-xs italic text-slate-500">
              Terbilang: {{ terbilang(totals.total, { titleCase: true }) }}
            </p>
          </section>
        </div>

        <!-- History -->
        <section v-else-if="tab === 'riwayat'" class="space-y-4">
          <div class="card">
            <p
              v-if="store.invoices.length === 0"
              class="text-sm text-slate-600"
            >
              Belum ada invoice tersimpan.
            </p>
            <ul v-else class="divide-y divide-slate-100 text-sm">
              <li
                v-for="invoice in store.invoices"
                :key="invoice.id"
                class="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
              >
                <div class="min-w-0 flex-1">
                  <p class="font-medium">
                    {{ invoice.number }} ·
                    {{ invoice.customer.name || 'Tanpa nama' }}
                  </p>
                  <p class="text-xs text-slate-500">
                    {{ invoice.issueDate }} ·
                    {{ formatRupiah(calculateInvoiceTotals(invoice).total) }}
                  </p>
                </div>
                <select
                  :value="invoice.status"
                  class="field-input w-32 py-1 text-sm"
                  :aria-label="`Status ${invoice.number}`"
                  @change="
                    setStatus(
                      invoice,
                      ($event.target as HTMLSelectElement)
                        .value as InvoiceStatus,
                    )
                  "
                >
                  <option value="draft">Draft</option>
                  <option value="terkirim">Terkirim</option>
                  <option value="lunas">Lunas</option>
                </select>
                <button type="button" class="btn-link" @click="edit(invoice)">
                  Ubah
                </button>
                <button
                  type="button"
                  class="btn-link"
                  @click="duplicate(invoice)"
                >
                  Duplikat
                </button>
                <button
                  type="button"
                  class="btn-link"
                  @click="download(invoice)"
                >
                  PDF
                </button>
                <button
                  type="button"
                  class="text-rose-700 hover:underline"
                  @click="removeInvoice(invoice.id)"
                >
                  Hapus
                </button>
              </li>
            </ul>
          </div>
          <InvoiceDataTools />
          <DonationCta placement="history" :slug="SLUG" />
        </section>

        <!-- Profile -->
        <section v-else class="card space-y-4">
          <BusinessProfileForm />
          <p class="text-xs text-slate-500">
            Tersimpan otomatis di browser ini.
          </p>
          <InvoiceDataTools />
        </section>
      </template>
      <template #fallback>
        <p class="text-sm text-slate-500">Memuat data dari browser...</p>
      </template>
    </ClientOnly>

    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
