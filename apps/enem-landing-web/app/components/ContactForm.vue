<script lang="ts" setup>
import { useTracker } from '@enem-landing/frontend/tracking';
import {
  CONTACT_HONEYPOT_FIELD,
  type ContactClientSignals,
  type ContactField,
} from '@enem-landing/shared-definitions';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { onMounted, ref } from 'vue';
import { contactSchema, mapServerErrors } from '../utils/contact-form';
import SliderCaptcha from './SliderCaptcha.vue';

defineEmits<{ 'show-business-card': [] }>();

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm({
  validationSchema: toTypedSchema(contactSchema),
  initialValues: { fullname: '', email: '', phoneNumber: '', message: '' },
});

// Validate on blur, then live while a field still shows an error.
const fieldConfig = (state: { errors: string[] }) => ({
  validateOnModelUpdate: state.errors.length > 0,
});
const [fullname, fullnameAttrs] = defineField('fullname', fieldConfig);
const [email, emailAttrs] = defineField('email', fieldConfig);
const [phoneNumber, phoneNumberAttrs] = defineField('phoneNumber', fieldConfig);
const [message, messageAttrs] = defineField('message', fieldConfig);

const honeypot = ref('');
const captcha = ref<InstanceType<typeof SliderCaptcha> | null>(null);
const captchaToken = ref('');
const captchaRequired = ref(true);
const captchaError = ref('');

const isSubmitting = ref(false);
const isSubmitted = ref(false);
const formError = ref('');

// Signals sent along for spam review (see sanitizeClientSignals).
const { visitorId, sessionId } = useTracker();
let shownAt = 0;
let keystrokeCount = 0;
let hadPointerMovement = false;
const pastedFields = new Set<ContactField>();

onMounted(() => {
  shownAt = performance.now();
});

const onCaptchaSolved = (token: string) => {
  captchaToken.value = token;
  captchaError.value = '';
};

const clientSignals = (): ContactClientSignals => ({
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: navigator.language,
  screenWidth: window.screen.width,
  screenHeight: window.screen.height,
  fillDurationMs: Math.round(performance.now() - shownAt),
  keystrokeCount,
  pastedFields: [...pastedFields],
  hadPointerMovement,
  visitorId: visitorId.value ?? undefined,
  sessionId: sessionId.value ?? undefined,
});

const restartSignals = () => {
  shownAt = performance.now();
  keystrokeCount = 0;
  hadPointerMovement = false;
  pastedFields.clear();
};

const onSubmit = handleSubmit(async (values) => {
  isSubmitted.value = false;
  formError.value = '';
  if (captchaRequired.value && !captchaToken.value) {
    captchaError.value = 'Please slide the puzzle piece into place';
    return;
  }

  isSubmitting.value = true;
  try {
    await $fetch('/api/contact-submissions', {
      method: 'POST',
      body: {
        ...values,
        captchaToken: captchaToken.value || undefined,
        client: clientSignals(),
        [CONTACT_HONEYPOT_FIELD]: honeypot.value,
      },
    });
    isSubmitted.value = true;
    resetForm();
    restartSignals();
  } catch (error) {
    const fetchError = error as {
      statusCode?: number;
      statusMessage?: string;
      data?: { message?: string; statusMessage?: string };
    };
    const serverMessage =
      fetchError.data?.message ??
      fetchError.data?.statusMessage ??
      fetchError.statusMessage;
    if (fetchError.statusCode === 429) {
      formError.value = 'Too many attempts. Please try again later.';
    } else {
      const { captcha: captchaMessage, ...fieldErrors } =
        mapServerErrors(serverMessage);
      setErrors(fieldErrors);
      if (captchaMessage) captchaError.value = captchaMessage;
      formError.value = 'Error sending message!';
    }
  } finally {
    isSubmitting.value = false;
    // The token is single-use: any attempt needs a fresh puzzle.
    if (captchaRequired.value) {
      captchaToken.value = '';
      captcha.value?.reset();
    }
  }
});

const inputClass = (error?: string) => [
  'w-full px-3 py-2 border-b-2 focus:outline-none',
  error
    ? 'border-red-500 focus:border-red-600'
    : 'border-slate-300 focus:border-[#0E7C6B]',
];
</script>

<template>
  <form
    class="space-y-4 mt-6"
    novalidate
    @submit.prevent="onSubmit"
    @keydown="keystrokeCount += 1"
    @pointermove.once="hadPointerMovement = true"
    @touchstart.passive.once="hadPointerMovement = true"
  >
    <div>
      <label for="fullname" class="block text-sm font-medium mb-1"
        >Full name</label
      >
      <input
        id="fullname"
        v-model="fullname"
        v-bind="fullnameAttrs"
        type="text"
        autocomplete="name"
        :aria-invalid="errors.fullname ? 'true' : undefined"
        :aria-describedby="errors.fullname ? 'fullname-error' : undefined"
        :class="inputClass(errors.fullname)"
        @paste="pastedFields.add('fullname')"
      />
      <p
        v-if="errors.fullname"
        id="fullname-error"
        class="mt-1 text-sm text-red-600"
      >
        {{ errors.fullname }}
      </p>
    </div>

    <div>
      <label for="email" class="block text-sm font-medium mb-1"
        >Email address</label
      >
      <input
        id="email"
        v-model="email"
        v-bind="emailAttrs"
        type="email"
        autocomplete="email"
        :aria-invalid="errors.email ? 'true' : undefined"
        :aria-describedby="errors.email ? 'email-error' : undefined"
        :class="inputClass(errors.email)"
        @paste="pastedFields.add('email')"
      />
      <p v-if="errors.email" id="email-error" class="mt-1 text-sm text-red-600">
        {{ errors.email }}
      </p>
    </div>

    <div>
      <label for="phone" class="block text-sm font-medium mb-1"
        >Phone number</label
      >
      <input
        id="phone"
        v-model="phoneNumber"
        v-bind="phoneNumberAttrs"
        type="tel"
        autocomplete="tel"
        :aria-invalid="errors.phoneNumber ? 'true' : undefined"
        :aria-describedby="errors.phoneNumber ? 'phone-error' : undefined"
        :class="inputClass(errors.phoneNumber)"
        @paste="pastedFields.add('phoneNumber')"
      />
      <p
        v-if="errors.phoneNumber"
        id="phone-error"
        class="mt-1 text-sm text-red-600"
      >
        {{ errors.phoneNumber }}
      </p>
    </div>

    <div>
      <label for="message" class="block text-sm font-medium mb-1"
        >Message</label
      >
      <textarea
        id="message"
        v-model="message"
        v-bind="messageAttrs"
        rows="5"
        :aria-invalid="errors.message ? 'true' : undefined"
        :aria-describedby="errors.message ? 'message-error' : undefined"
        :class="inputClass(errors.message)"
        @paste="pastedFields.add('message')"
      />
      <p
        v-if="errors.message"
        id="message-error"
        class="mt-1 text-sm text-red-600"
      >
        {{ errors.message }}
      </p>
    </div>

    <!-- Honeypot: invisible to people and screen readers; bots fill it. -->
    <div
      class="absolute -left-[10000px] top-auto w-px h-px overflow-hidden"
      aria-hidden="true"
    >
      <label for="contact-website">Website</label>
      <input
        id="contact-website"
        v-model="honeypot"
        :name="CONTACT_HONEYPOT_FIELD"
        type="text"
        tabindex="-1"
        autocomplete="off"
      />
    </div>

    <SliderCaptcha
      v-if="captchaRequired"
      ref="captcha"
      :error="captchaError"
      @solved="onCaptchaSolved"
      @reset="captchaToken = ''"
      @disabled="captchaRequired = false"
    />

    <p
      v-if="isSubmitted"
      class="text-center font-semibold text-green-600"
      role="status"
    >
      Form submission successful!
    </p>
    <p v-if="formError" class="text-center text-red-600" role="alert">
      {{ formError }}
    </p>

    <div class="flex justify-center gap-3">
      <button
        type="submit"
        :disabled="isSubmitting"
        class="px-6 py-3 rounded bg-[#0E7C6B] text-white font-bold disabled:opacity-50"
      >
        {{ isSubmitting ? 'Sending...' : 'Send' }}
      </button>
      <button
        type="button"
        class="px-6 py-3 rounded bg-[#2C3E50] text-white font-bold"
        @click="$emit('show-business-card')"
      >
        Get Business Card
      </button>
    </div>
  </form>
</template>
