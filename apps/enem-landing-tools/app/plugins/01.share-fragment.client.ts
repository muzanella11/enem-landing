import { SHARE_FRAGMENT_PREFIX } from '~/utils/share-state';

/**
 * Keeps share-link state (`#s=...`, Story 20) out of the address bar.
 *
 * - Full page load: the fragment is read before anything else runs and
 *   removed right away, before the tracker records the pageview and before
 *   any ad script can read `location`. vue-router's initial navigation
 *   writes the hash back, so the route is replaced again once it is ready.
 * - In-app navigation (e.g. "Hitung gaji bersih" from the UMP page): a
 *   router guard takes the fragment and redirects to the same route
 *   without it, so it never reaches the address bar at all.
 *
 * `share-fragment-cleared` gates the ad slots until the fragment is gone.
 */
export default defineNuxtPlugin(() => {
  const cleared = useState('share-fragment-cleared', () => true);
  const fragment = useState<string | null>('shared-fragment', () => null);
  const router = useRouter();

  const stripFromAddressBar = () => {
    const { pathname, search } = window.location;
    window.history.replaceState(
      window.history.state,
      '',
      `${pathname}${search}`,
    );
  };

  router.beforeEach((to) => {
    if (!to.hash.startsWith(SHARE_FRAGMENT_PREFIX)) return;
    fragment.value = to.hash;
    return { path: to.path, query: to.query, hash: '', replace: true };
  });

  const { hash } = window.location;
  if (!hash.startsWith(SHARE_FRAGMENT_PREFIX)) return;

  cleared.value = false;
  fragment.value = hash;
  stripFromAddressBar();

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
