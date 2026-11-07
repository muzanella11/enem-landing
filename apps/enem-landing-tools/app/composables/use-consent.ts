/**
 * Cookie/ads consent (Story 20). Recording is always on for now: the
 * banner is hidden and there is no opt-out on the site, so every visitor
 * is `granted` (personalized ads + Google Analytics). /privasi points to
 * Google's own ad settings for opting out of personalized ads. The state
 * and the banner component are kept so asking can be switched back on;
 * `unset` only exists during SSR, before the client plugin ran.
 */
export type ConsentState = 'unset' | 'granted' | 'denied';

const STORAGE_KEY = 'elt_consent';

export const useConsent = () => {
  const state = useState<ConsentState>('consent', () => 'unset');

  // Always recording for now (see above), whatever was stored before.
  const load = () => {
    state.value = 'granted';
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
