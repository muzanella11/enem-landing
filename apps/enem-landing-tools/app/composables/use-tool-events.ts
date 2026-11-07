import { useTracker } from '@enem-landing/frontend/tracking';

/**
 * Standard events every tool sends (Story 25). Payloads only ever carry
 * ids and labels; the tracker, this app's BFF, and the API each strip
 * anything else, so never pass user input here.
 */
export const useToolEvents = (toolId: string) => {
  const tracker = useTracker();
  const embed = useEmbed();
  const send = (name: string, extra: Record<string, string> = {}) => {
    // Embedded widgets (Story 49) never track visitors of other sites.
    if (import.meta.server || embed.value) return;
    void tracker.track(name, { toolId, ...extra });
  };
  return {
    view: () => send('tool_view'),
    calculate: (mode?: string) => send('tool_calculate', mode ? { mode } : {}),
    share: () => send('tool_share'),
    download: (action: string) => send('tool_download', { action }),
  };
};
