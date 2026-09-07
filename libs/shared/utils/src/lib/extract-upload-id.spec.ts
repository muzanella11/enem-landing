import { describe, expect, it } from 'vitest';
import { extractUploadId } from './extract-upload-id.js';

describe('extractUploadId', () => {
  it('extracts the uuid from a keyed R2 URL', () => {
    expect(
      extractUploadId(
        'https://cdn.example.com/enem-landing-cms/blog-post-cover/2f6b1c1a-9b1e-4b4a-9b3a-2e9c9d9f9a9a.jpg',
      ),
    ).toBe('2f6b1c1a-9b1e-4b4a-9b3a-2e9c9d9f9a9a');
  });

  it('returns null for a URL with no filename segment', () => {
    expect(extractUploadId('https://cdn.example.com/')).toBeNull();
  });
});
