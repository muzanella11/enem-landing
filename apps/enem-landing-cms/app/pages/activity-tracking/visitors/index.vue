<script lang="ts" setup>
import type { TrackingVisitor } from '@enem-landing/shared-types';
import { ref } from 'vue';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Activity Tracking Visitors' });

const { data: visitors } = await useFetch<TrackingVisitor[]>(
  '/api/tracking/visitors',
);

const headers = [
  { title: 'Waktu', key: 'startedAt' },
  { title: 'IP', key: 'ipAddress' },
  { title: 'Lokasi', key: 'location' },
  { title: 'ISP/Provider', key: 'isp' },
  { title: 'Device', key: 'deviceType' },
  { title: 'Browser', key: 'browserName' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
];

const locationOf = (visitor: TrackingVisitor): string =>
  [visitor.city, visitor.region, visitor.country].filter(Boolean).join(', ') ||
  '-';

const detailDialog = ref(false);
const selectedVisitor = ref<TrackingVisitor | null>(null);

const openDetail = (visitor: TrackingVisitor): void => {
  selectedVisitor.value = visitor;
  detailDialog.value = true;
};

const detailRows = (
  visitor: TrackingVisitor,
): { label: string; value: string }[] => [
  { label: 'Session ID', value: visitor.id },
  { label: 'Visitor ID', value: visitor.visitorId },
  { label: 'Mulai', value: new Date(visitor.startedAt).toLocaleString() },
  {
    label: 'Berakhir',
    value: visitor.endedAt ? new Date(visitor.endedAt).toLocaleString() : '-',
  },
  { label: 'Referrer', value: visitor.referrer ?? '-' },
  { label: 'UTM Source', value: visitor.utmSource ?? '-' },
  { label: 'UTM Medium', value: visitor.utmMedium ?? '-' },
  { label: 'UTM Campaign', value: visitor.utmCampaign ?? '-' },
  { label: 'IP Address', value: visitor.ipAddress ?? '-' },
  { label: 'Negara', value: visitor.country ?? '-' },
  { label: 'Provinsi/Region', value: visitor.region ?? '-' },
  { label: 'Kota', value: visitor.city ?? '-' },
  {
    label: 'Koordinat',
    value:
      visitor.latitude != null && visitor.longitude != null
        ? `${visitor.latitude}, ${visitor.longitude}`
        : '-',
  },
  { label: 'ISP', value: visitor.isp ?? '-' },
  { label: 'Organisasi', value: visitor.org ?? '-' },
  { label: 'ASN', value: visitor.asn ?? '-' },
  { label: 'Device Type', value: visitor.deviceType ?? '-' },
  { label: 'Device Vendor', value: visitor.deviceVendor ?? '-' },
  { label: 'Device Model', value: visitor.deviceModel ?? '-' },
  {
    label: 'Browser',
    value: [visitor.browserName, visitor.browserVersion]
      .filter(Boolean)
      .join(' '),
  },
  {
    label: 'Engine',
    value: [visitor.engineName, visitor.engineVersion]
      .filter(Boolean)
      .join(' '),
  },
  {
    label: 'OS',
    value: [visitor.osName, visitor.osVersion].filter(Boolean).join(' '),
  },
  { label: 'CPU Architecture', value: visitor.cpuArchitecture ?? '-' },
  { label: 'Bahasa', value: visitor.language ?? '-' },
  { label: 'Timezone', value: visitor.timezone ?? '-' },
  {
    label: 'Ukuran Layar',
    value:
      visitor.screenWidth != null && visitor.screenHeight != null
        ? `${visitor.screenWidth} x ${visitor.screenHeight}`
        : '-',
  },
  {
    label: 'Direkam (Session Recording)',
    value: visitor.recordingSampled ? 'Ya' : 'Tidak',
  },
];
</script>

<template>
  <div>
    <CListPage
      title="Visitors"
      subtitle="Seluruh sesi pengunjung beserta IP dan detail geolocation-nya."
      :meta="`${visitors?.length ?? 0} sesi`"
    >
      <template #actions>
        <v-btn
          to="/activity-tracking"
          variant="text"
          prepend-icon="mdi-arrow-left"
          >Overview</v-btn
        >
      </template>

      <v-data-table :headers="headers" :items="visitors ?? []" item-value="id">
        <template #item.startedAt="{ item }">
          {{ new Date(item.startedAt).toLocaleString() }}
        </template>
        <template #item.ipAddress="{ item }">
          <span>{{ item.ipAddress ?? '-' }}</span>
        </template>
        <template #item.location="{ item }">
          {{ locationOf(item) }}
        </template>
        <template #item.isp="{ item }">
          {{ item.isp ?? '-' }}
        </template>
        <template #item.actions="{ item }">
          <v-btn
            size="small"
            variant="text"
            color="primary"
            prepend-icon="mdi-eye-outline"
            @click="openDetail(item)"
            >Detail</v-btn
          >
        </template>
      </v-data-table>
    </CListPage>

    <CModal
      v-model="detailDialog"
      :title="
        selectedVisitor
          ? `Detail Visitor - ${selectedVisitor.ipAddress ?? selectedVisitor.id}`
          : 'Detail Visitor'
      "
      max-width="640"
      scrollable
    >
      <template v-if="selectedVisitor">
        <v-table density="compact">
          <tbody>
            <tr v-for="row in detailRows(selectedVisitor)" :key="row.label">
              <td class="l-visitors__detail-label">{{ row.label }}</td>
              <td>{{ row.value }}</td>
            </tr>
          </tbody>
        </v-table>
      </template>
      <template #actions>
        <v-btn variant="text" @click="detailDialog = false">Tutup</v-btn>
      </template>
    </CModal>
  </div>
</template>

<style lang="scss">
.l-visitors__detail-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  width: 160px;
  padding-right: 12px;
  white-space: nowrap;
}
</style>
