import { describe, expect, it } from 'vitest';
import { slugify } from './slugify.js';

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('Contact Us')).toBe('contact-us');
  });

  it('strips non-alphanumeric characters', () => {
    expect(slugify('  Hello, World!! ')).toBe('hello-world');
  });

  it('collapses repeated separators and trims leading/trailing hyphens', () => {
    expect(slugify('--Foo___Bar--')).toBe('foo-bar');
  });
});
