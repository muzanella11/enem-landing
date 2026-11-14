import { countUrls, hasLinkMarkup } from '@enem-landing/shared-definitions';
import { Transform } from 'class-transformer';
import { ValidateBy, type ValidationOptions } from 'class-validator';

/** Trims string input before validation (non-strings pass through). */
export const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

/** Trims and lowercases string input. */
export const TrimLowercase = () =>
  Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );

/** At most `max` link-looking substrings (`MaxUrls(0)` forbids links). */
export const MaxUrls = (max: number, options?: ValidationOptions) =>
  ValidateBy(
    {
      name: 'maxUrls',
      constraints: [max],
      validator: {
        validate: (value: unknown) =>
          typeof value !== 'string' || countUrls(value) <= max,
      },
    },
    options,
  );

/** No HTML anchors or BBCode links. */
export const NoLinkMarkup = (options?: ValidationOptions) =>
  ValidateBy(
    {
      name: 'noLinkMarkup',
      validator: {
        validate: (value: unknown) =>
          typeof value !== 'string' || !hasLinkMarkup(value),
      },
    },
    options,
  );
