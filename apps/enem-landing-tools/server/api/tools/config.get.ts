import type { ToolsPublicConfig } from '@enem-landing/shared-types';
import { TOOLS_SNAPSHOT } from '../../../shared/tools-registry';
import { createApiClient } from '../../utils/api-client';

/**
 * Tool registry, ad switches, and donation options from the CMS (Story
 * 25). Falls back to the build-time snapshot when enem-landing-api is
 * unreachable, so the hub never renders an empty page or an error.
 */
export default defineEventHandler(
  async (event): Promise<ToolsPublicConfig & { fallback: boolean }> => {
    try {
      const config = (await createApiClient(event).get(
        '/tools/config',
      )) as unknown as ToolsPublicConfig;
      return { ...config, fallback: false };
    } catch (error) {
      console.warn('[tools-config] falling back to snapshot', error);
      return { ...TOOLS_SNAPSHOT, fallback: true };
    }
  },
);
