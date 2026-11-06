import { describe, expect, it } from 'vitest';
import { formatRupiah, parseRupiah } from './format.js';
import { decodeShareState, encodeShareState } from './share-state.js';

describe('parseRupiah', () => {
  it.each([
    ['Rp 1.250.000', 1_250_000],
    ['1250000', 1_250_000],
    ['1.250.000,50', 1_250_000.5],
    ['', 0],
    ['abc', 0],
  ])('%s -> %d', (input, expected) => {
    expect(parseRupiah(input)).toBe(expected);
  });
});

describe('formatRupiah', () => {
  it('formats whole rupiah with dot separators', () => {
    expect(formatRupiah(1_250_000.4)).toBe('Rp1.250.000');
  });
});

describe('share state', () => {
  it('round-trips state for the same tool, including non-ASCII', () => {
    const hash = encodeShareState('kpr', {
      price: 500_000_000,
      note: 'rumah ü',
    });
    expect(hash.startsWith('#s=')).toBe(true);
    expect(decodeShareState(hash, 'kpr')).toEqual({
      price: 500_000_000,
      note: 'rumah ü',
    });
  });

  it('ignores fragments for another tool or garbage', () => {
    const hash = encodeShareState('kpr', { a: 1 });
    expect(decodeShareState(hash, 'zakat')).toBeNull();
    expect(decodeShareState('#s=!!!', 'kpr')).toBeNull();
    expect(decodeShareState('#section', 'kpr')).toBeNull();
  });
});
