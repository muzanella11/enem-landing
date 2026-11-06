import { decodeShareState } from '~/utils/share-state';

/**
 * State from a share link (Story 20). The `share-fragment` plugin moved
 * the fragment out of the address bar before anything else ran; this
 * hands it to the tool once, on the client.
 */
export const useSharedState = <T>(toolId: string): T | null => {
  const fragment = useState<string | null>('shared-fragment', () => null);
  if (!fragment.value) return null;
  const decoded = decodeShareState<T>(fragment.value, toolId);
  if (decoded) fragment.value = null;
  return decoded;
};
