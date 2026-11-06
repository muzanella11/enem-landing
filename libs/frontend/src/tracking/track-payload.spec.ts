import { describe, expect, it } from 'vitest';
import { readTrackPayload } from './track-payload.js';

const element = (dataset: Record<string, string>) =>
  ({ dataset }) as unknown as HTMLElement;

describe('readTrackPayload', () => {
  it('turns data-track-* attributes into a camelCase payload', () => {
    expect(
      readTrackPayload(
        element({
          track: 'donate_click',
          trackToolId: 'simulasi-kpr',
          trackPlacement: 'after-result',
        }),
      ),
    ).toEqual({ toolId: 'simulasi-kpr', placement: 'after-result' });
  });

  it('returns undefined when only the event name is set', () => {
    expect(
      readTrackPayload(element({ track: 'contact_click' })),
    ).toBeUndefined();
  });

  it('ignores unrelated data attributes', () => {
    expect(
      readTrackPayload(element({ track: 'x', testid: 'button' })),
    ).toBeUndefined();
  });
});
