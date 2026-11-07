const lowerFirst = (value: string): string =>
  value.charAt(0).toLowerCase() + value.slice(1);

/**
 * `data-track="event_name"` sends that event on click. Extra
 * `data-track-*` attributes become the payload, e.g.
 * `data-track-tool-id="kpr"` -> `{ toolId: 'kpr' }`.
 */
export const readTrackPayload = (
  element: HTMLElement,
): Record<string, string> | undefined => {
  const payload: Record<string, string> = {};
  for (const [key, value] of Object.entries(element.dataset)) {
    if (key === 'track' || !key.startsWith('track') || value === undefined) {
      continue;
    }
    payload[lowerFirst(key.slice('track'.length))] = value;
  }
  return Object.keys(payload).length > 0 ? payload : undefined;
};
