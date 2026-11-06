import { SHARE_FRAGMENT_PREFIX } from '~/utils/share-state';

/**
 * Runs first on the client: if the page was opened from a share link,
 * keep the fragment in memory and remove it from the address bar - before
 * the tracker records the pageview and before any ad script loads and
 * reads `location` (Story 20).
 *
 * Removing it once is not enough: vue-router's initial navigation writes
 * the full URL (hash included) back after plugins run, so the route itself
 * is replaced once the router is ready. `share-fragment-cleared` gates the
 * ad slots until that has happened.
 */
export default defineNuxtPlugin(() => {
  const cleared = useState('share-fragment-cleared', () => true);
  const { hash } = window.location;
  if (!hash.startsWith(SHARE_FRAGMENT_PREFIX)) return;

  cleared.value = false;
  useState<string | null>('shared-fragment', () => null).value = hash;

  const stripFromAddressBar = () => {
    const { pathname, search } = window.location;
    window.history.replaceState(
      window.history.state,
      '',
      `${pathname}${search}`,
    );
  };
  stripFromAddressBar();

  const router = useRouter();
  void router.isReady().then(async () => {
    const current = router.currentRoute.value;
    if (current.hash) {
      await router.replace({
        path: current.path,
        query: current.query,
        hash: '',
      });
    }
    stripFromAddressBar();
    cleared.value = true;
  });
});
