import {
  CONTACT_EMAIL_MAX,
  CONTACT_FULLNAME_MAX,
  CONTACT_FULLNAME_MIN,
  CONTACT_MESSAGE_MAX,
  CONTACT_MESSAGE_MAX_URLS,
  CONTACT_MESSAGE_MIN,
  CONTACT_PHONE_PATTERN,
  countUrls,
  hasLinkMarkup,
} from '@enem-landing/shared-definitions';
import { z } from 'zod';

/**
 * Contact form schema. Limits come from the same shared constants as the
 * API's DTO, so the browser never accepts what the server would reject.
 */
export const contactSchema = z.object({
  fullname: z
    .string()
    .trim()
    .min(CONTACT_FULLNAME_MIN, 'Please enter your name')
    .max(
      CONTACT_FULLNAME_MAX,
      `Name must be at most ${CONTACT_FULLNAME_MAX} characters`,
    )
    .refine((value) => countUrls(value) === 0, 'Name cannot contain links'),
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email address')
    .max(
      CONTACT_EMAIL_MAX,
      `Email must be at most ${CONTACT_EMAIL_MAX} characters`,
    )
    .email('Please enter a valid email address'),
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Please enter your phone number')
    .regex(
      CONTACT_PHONE_PATTERN,
      'Please enter a valid phone number (8 to 20 digits)',
    ),
  message: z
    .string()
    .trim()
    .min(
      CONTACT_MESSAGE_MIN,
      `Message must be at least ${CONTACT_MESSAGE_MIN} characters`,
    )
    .max(
      CONTACT_MESSAGE_MAX,
      `Message must be at most ${CONTACT_MESSAGE_MAX} characters`,
    )
    .refine(
      (value) => countUrls(value) <= CONTACT_MESSAGE_MAX_URLS,
      `Message can contain at most ${CONTACT_MESSAGE_MAX_URLS} links`,
    )
    .refine(
      (value) => !hasLinkMarkup(value),
      'Message cannot contain HTML or BBCode links',
    ),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

export type ContactErrorField = keyof ContactFormValues | 'captcha';

const SERVER_FIELDS: Record<string, ContactErrorField> = {
  fullname: 'fullname',
  email: 'email',
  phoneNumber: 'phoneNumber',
  message: 'message',
  captchaToken: 'captcha',
};

/**
 * Splits the API's joined 400 message ("phoneNumber must be ..., message
 * must be ...") back into per-field errors. Every server message starts with
 * its field name and contains no comma.
 */
export const mapServerErrors = (
  message: string | undefined,
): Partial<Record<ContactErrorField, string>> => {
  const errors: Partial<Record<ContactErrorField, string>> = {};
  for (const part of (message ?? '').split(', ')) {
    const match = /^(\w+) (.+)$/.exec(part.trim());
    const [, name, text] = match ?? [];
    const field = name ? SERVER_FIELDS[name] : undefined;
    if (!field || !text || errors[field]) continue;
    errors[field] = text.charAt(0).toUpperCase() + text.slice(1);
  }
  return errors;
};
