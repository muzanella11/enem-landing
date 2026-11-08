import { trackGaEvent, useTracker } from '@enem-landing/frontend/tracking';

/**
 * Standard events every tool sends (Story 25). Payloads only ever carry
 * ids and labels; the tracker, this app's BFF, and the API each strip
 * anything else, so never pass user input here.
 *
 * Story 56: the in-house tracker stays the source of truth for usage.
 * Calculate, share, and download are also mirrored to GA4 (same ids and
 * labels, nothing else) so search and AdSense reports can tell which
 * traffic sources bring visitors who actually use a tool. `tool_view` is
 * not mirrored: GA4's own page_view already covers it.
 */
export const useToolEvents = (toolId: string) => {
  const tracker = useTracker();
  const embed = useEmbed();
  const send = (
    name: string,
    extra: Record<string, string> = {},
    toGa = false,
  ) => {
    // Embedded widgets (Story 49) never track visitors of other sites.
    if (import.meta.server || embed.value) return;
    void tracker.track(name, { toolId, ...extra });
    if (toGa) trackGaEvent(name, { tool_id: toolId, ...extra });
  };
  return {
    view: () => send('tool_view'),
    calculate: (mode?: string) =>
      send('tool_calculate', mode ? { mode } : {}, true),
    share: () => send('tool_share', {}, true),
    download: (action: string) => send('tool_download', { action }, true),
  };
};
