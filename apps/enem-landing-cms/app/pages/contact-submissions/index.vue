<script lang="ts" setup>
import type {
  ContactSubmission,
  ContactSubmissionDetail,
  ContactSubmissionSender,
  ContactSubmissionStatusFilter,
} from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';
import { computed, ref } from 'vue';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Contact Submissions' });

const snackbar = useGlobalSnackbar();

const status = ref<ContactSubmissionStatusFilter>('inbox');
const ipFilter = ref<string | null>(null);
const visitorFilter = ref<string | null>(null);

const query = computed(() => ({
  status: status.value,
  ipAddress: ipFilter.value ?? undefined,
  visitorId: visitorFilter.value ?? undefined,
}));

const { data: submissions, refresh } = await useFetch<ContactSubmission[]>(
  '/api/contact-submissions',
  { query },
);

const headers = computed(() => [
  { title: 'Name', key: 'fullname' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phoneNumber' },
  { title: 'Message', key: 'message' },
  ...(status.value === 'inbox'
    ? []
    : [{ title: 'Spam reason', key: 'spamReason' }]),
  { title: 'Submitted', key: 'createdAt' },
  { title: 'Status', key: 'readAt' },
  { title: '', key: 'actions', sortable: false },
]);

const formatDate = (value: string) => new Date(value).toLocaleString('id-ID');

const markAsRead = async (submission: ContactSubmission) => {
  try {
    await $fetch(`/api/contact-submissions/${submission.id}/read`, {
      method: 'patch',
    });
    await refresh();
    snackbar.success('Marked as read.');
  } catch (err) {
    snackbar.error(err);
  }
};

const setSpam = async (submission: ContactSubmission, isSpam: boolean) => {
  try {
    await $fetch(`/api/contact-submissions/${submission.id}/spam`, {
      method: 'patch',
      body: { isSpam },
    });
    await refresh();
    if (detail.value?.id === submission.id) {
      detail.value = { ...detail.value, isSpam };
    }
    snackbar.success(
      isSpam ? 'Moved to spam.' : 'Moved to inbox. No email was sent.',
    );
  } catch (err) {
    snackbar.error(err);
  }
};

// Detail dialog with the sender record.
const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<ContactSubmissionDetail | null>(null);

const openDetail = async (submission: ContactSubmission) => {
  detailOpen.value = true;
  detailLoading.value = true;
  detail.value = null;
  try {
    detail.value = await $fetch<ContactSubmissionDetail>(
      `/api/contact-submissions/${submission.id}`,
    );
  } catch (err) {
    snackbar.error(err);
    detailOpen.value = false;
  } finally {
    detailLoading.value = false;
  }
};

const filterBySource = (kind: 'ip' | 'visitor') => {
  const sender = detail.value?.sender;
  if (!sender) return;
  ipFilter.value = kind === 'ip' ? sender.ipAddress : null;
  visitorFilter.value = kind === 'visitor' ? sender.visitorId : null;
  status.value = 'all';
  detailOpen.value = false;
};

const clearSourceFilter = () => {
  ipFilter.value = null;
  visitorFilter.value = null;
};

const copyIp = async (ip: string) => {
  try {
    await navigator.clipboard.writeText(ip);
    snackbar.success('IP copied. Block it in Cloudflare WAF if needed.');
  } catch (err) {
    snackbar.error(err);
  }
};

interface Warning {
  label: string;
  color: string;
}

const warningsFor = (sender: ContactSubmissionSender): Warning[] => {
  const warnings: Warning[] = [];
  if (sender.isTor) warnings.push({ label: 'Tor', color: 'error' });
  if (sender.isHosting) warnings.push({ label: 'Data center', color: 'error' });
  if (sender.isProxy) warnings.push({ label: 'Proxy / VPN', color: 'warning' });
  if (sender.timezoneMismatch) {
    warnings.push({
      label: 'Timezone does not match country',
      color: 'warning',
    });
  }
  if (!sender.visitorId || sender.hasTrackedVisit === false) {
    warnings.push({ label: 'No tracked visit', color: 'warning' });
  }
  if (sender.pastedFields && sender.pastedFields.length >= 4) {
    warnings.push({ label: 'Everything pasted', color: 'warning' });
  }
  if (sender.hadPointerMovement === false) {
    warnings.push({ label: 'No mouse or touch movement', color: 'warning' });
  }
  if (sender.isDisposableEmail)
    warnings.push({ label: 'Disposable email', color: 'error' });
  if (sender.emailHasMx === false) {
    warnings.push({ label: 'Email domain has no mail server', color: 'error' });
  }
  if (sender.phoneValid === false)
    warnings.push({ label: 'Invalid phone number', color: 'warning' });
  return warnings;
};

const yesNo = (value: boolean | null) =>
  value === null ? 'Unknown' : value ? 'Yes' : 'No';

const senderRows = (sender: ContactSubmissionSender) => [
  {
    group: 'Network',
    rows: [
      ['IP address', sender.ipAddress],
      [
        'Location',
        [sender.city, sender.region, sender.country ?? sender.countryCode]
          .filter(Boolean)
          .join(', '),
      ],
      [
        'ISP / organisation',
        [sender.isp, sender.org].filter(Boolean).join(' / '),
      ],
      ['ASN', sender.asn],
      ['Proxy / VPN', yesNo(sender.isProxy)],
      ['Data center', yesNo(sender.isHosting)],
      ['Tor exit', yesNo(sender.isTor)],
      ['Cloudflare Ray ID', sender.cfRay],
    ],
  },
  {
    group: 'Browser',
    rows: [
      ['User agent', sender.userAgent],
      ['Accept-Language', sender.acceptLanguage],
      ['Language', sender.language],
      ['Timezone', sender.timezone],
      [
        'Screen',
        sender.screenWidth && sender.screenHeight
          ? `${sender.screenWidth} x ${sender.screenHeight}`
          : null,
      ],
      ['Referer', sender.referer],
    ],
  },
  {
    group: 'Form behaviour',
    rows: [
      [
        'Time to fill',
        sender.fillDurationMs === null
          ? null
          : `${(sender.fillDurationMs / 1000).toFixed(1)} s`,
      ],
      ['Keys pressed', sender.keystrokeCount?.toString() ?? null],
      ['Pasted fields', sender.pastedFields?.join(', ') || 'None'],
      ['Mouse / touch movement', yesNo(sender.hadPointerMovement)],
    ],
  },
  {
    group: 'Visit, email and phone',
    rows: [
      ['Visitor ID', sender.visitorId],
      ['Tracked visit before sending', yesNo(sender.hasTrackedVisit)],
      ['Email has mail server', yesNo(sender.emailHasMx)],
      ['Disposable email', yesNo(sender.isDisposableEmail)],
      ['Phone country', sender.phoneCountry],
      ['Phone valid', yesNo(sender.phoneValid)],
    ],
  },
];
</script>

<template>
  <div>
    <CListPage
      title="Contact Submissions"
      :meta="`${submissions?.length ?? 0} submission`"
    >
      <template #filters>
        <div class="d-flex flex-wrap align-center ga-3">
          <v-btn-toggle
            v-model="status"
            mandatory
            density="comfortable"
            variant="outlined"
            color="primary"
          >
            <v-btn value="inbox">Inbox</v-btn>
            <v-btn value="spam">Spam</v-btn>
            <v-btn value="all">All</v-btn>
          </v-btn-toggle>
          <v-chip
            v-if="ipFilter || visitorFilter"
            closable
            color="primary"
            variant="tonal"
            @click:close="clearSourceFilter"
          >
            {{ ipFilter ? `IP ${ipFilter}` : `Visitor ${visitorFilter}` }}
          </v-chip>
        </div>
      </template>

      <v-data-table
        :headers="headers"
        :items="submissions ?? []"
        item-value="id"
        class="c-data-table"
      >
        <template #item.message="{ item }">
          <span class="c-contact__message">{{ item.message }}</span>
        </template>
        <template #item.spamReason="{ item }">
          <span v-if="item.isSpam" class="text-caption text-error">{{
            item.spamReason
          }}</span>
        </template>
        <template #item.readAt="{ item }">
          <v-chip v-if="item.isSpam" size="small" color="error" variant="tonal"
            >Spam</v-chip
          >
          <v-chip
            v-else-if="item.readAt"
            size="small"
            color="success"
            variant="tonal"
            >Read</v-chip
          >
          <v-chip v-else size="small" color="warning" variant="tonal"
            >Unread</v-chip
          >
        </template>
        <template #item.createdAt="{ item }">
          <span class="text-medium-emphasis">{{
            formatDate(item.createdAt)
          }}</span>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-btn size="small" variant="text" @click="openDetail(item)"
              >Details</v-btn
            >
            <v-btn
              v-if="!item.readAt && !item.isSpam"
              size="small"
              variant="text"
              color="primary"
              @click="markAsRead(item)"
              >Mark as read</v-btn
            >
            <v-btn
              size="small"
              variant="text"
              :color="item.isSpam ? 'success' : 'error'"
              @click="setSpam(item, !item.isSpam)"
              >{{ item.isSpam ? 'Not spam' : 'Mark spam' }}</v-btn
            >
          </div>
        </template>
      </v-data-table>
    </CListPage>

    <CModal
      v-model="detailOpen"
      title="Contact submission"
      icon="mdi-email-search-outline"
      max-width="760"
      scrollable
    >
      <div v-if="detailLoading" class="d-flex justify-center pa-6">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <div v-else-if="detail">
        <div class="mb-4">
          <div class="text-subtitle-1 font-weight-bold">
            {{ detail.fullname }}
          </div>
          <div class="text-medium-emphasis text-body-2">
            {{ detail.email }} &middot; {{ detail.phoneNumber }} &middot;
            {{ formatDate(detail.createdAt) }}
          </div>
          <p class="c-contact__message mt-3">{{ detail.message }}</p>
          <v-alert
            v-if="detail.isSpam"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            Flagged as spam: {{ detail.spamReason }}
          </v-alert>
        </div>

        <template v-if="detail.sender">
          <div class="d-flex flex-wrap ga-2 mb-4">
            <v-chip
              v-for="warning in warningsFor(detail.sender)"
              :key="warning.label"
              size="small"
              :color="warning.color"
              variant="tonal"
              >{{ warning.label }}</v-chip
            >
          </div>

          <div class="d-flex flex-wrap ga-2 mb-4">
            <v-btn
              v-if="detail.sender.ipAddress"
              size="small"
              variant="outlined"
              prepend-icon="mdi-content-copy"
              @click="copyIp(detail.sender.ipAddress)"
              >Copy IP</v-btn
            >
            <v-btn
              v-if="detail.sender.ipAddress"
              size="small"
              variant="outlined"
              :disabled="detail.sameIpCount === 0"
              @click="filterBySource('ip')"
              >{{ detail.sameIpCount }} other(s) from this IP</v-btn
            >
            <v-btn
              v-if="detail.sender.visitorId"
              size="small"
              variant="outlined"
              :disabled="detail.sameVisitorCount === 0"
              @click="filterBySource('visitor')"
              >{{ detail.sameVisitorCount }} other(s) from this visitor</v-btn
            >
            <v-btn
              v-if="detail.sender.sessionId"
              size="small"
              variant="outlined"
              prepend-icon="mdi-play-circle-outline"
              :to="`/activity-tracking/sessions/${detail.sender.sessionId}`"
              >Visit session</v-btn
            >
          </div>

          <div
            v-for="section in senderRows(detail.sender)"
            :key="section.group"
            class="mb-4"
          >
            <div class="text-overline">{{ section.group }}</div>
            <v-table density="compact">
              <tbody>
                <tr v-for="[label, value] in section.rows" :key="label ?? ''">
                  <td class="text-medium-emphasis c-contact__label">
                    {{ label }}
                  </td>
                  <td class="c-contact__value">{{ value || '-' }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </template>
        <v-alert v-else type="info" variant="tonal" density="compact">
          No sender details: sent before they were recorded, or older than 90
          days.
        </v-alert>
      </div>

      <template v-if="detail" #actions>
        <v-btn
          variant="text"
          :color="detail.isSpam ? 'success' : 'error'"
          @click="setSpam(detail, !detail.isSpam)"
          >{{ detail.isSpam ? 'Not spam' : 'Mark as spam' }}</v-btn
        >
        <v-btn variant="text" @click="detailOpen = false">Close</v-btn>
      </template>
    </CModal>
  </div>
</template>

<style lang="scss" scoped>
.c-contact__message {
  white-space: pre-wrap;
  word-break: break-word;
}

.c-contact__label {
  width: 220px;
  white-space: nowrap;
}

.c-contact__value {
  word-break: break-all;
}
</style>
