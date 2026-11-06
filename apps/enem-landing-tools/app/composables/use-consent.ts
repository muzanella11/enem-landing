/**
 * Cookie/ads consent (UU PDP, Story 20). `unset` until the visitor
 * chooses; ads load only after a choice, and `denied` means
 * non-personalized ads with no personalization cookies.
 */
export type ConsentState = 'unset' | 'granted' | 'denied';

const STORAGE_KEY = 'elt_consent';

export const useConsent = () => {
  const state = useState<ConsentState>('consent', () => 'unset');

  const load = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'granted' || stored === 'denied') state.value = stored;
    } catch {
      // Storage blocked: stays `unset`, the banner shows each visit.
    }
  };

  const set = (value: Exclude<ConsentState, 'unset'>) => {
    state.value = value;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Choice still applies for this page view.
    }
  };

  return { state, load, set };
};
