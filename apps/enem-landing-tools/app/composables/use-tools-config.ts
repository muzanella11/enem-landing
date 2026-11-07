import type { ToolsPublicConfig } from '@enem-landing/shared-types';
import { TOOLS_SNAPSHOT } from '~~/shared/tools-registry';

type ConfigResponse = ToolsPublicConfig & { fallback: boolean };

/**
 * Registry, ad switches, and donation options for the whole hub (Story
 * 25), fetched once per render and shared through Nuxt's payload.
 */
export const useToolsConfig = () => {
  const { data } = useFetch<ConfigResponse>('/api/tools/config', {
    key: 'tools-config',
    default: () => ({ ...TOOLS_SNAPSHOT, fallback: true }),
  });

  const config = computed(
    () => data.value ?? { ...TOOLS_SNAPSHOT, fallback: true },
  );

  // The live registry only lists enabled tools; the build-time snapshot
  // lists every tool with its flag, so disabled ones are filtered here too.
  const findTool = (slug: string) =>
    config.value.tools.find(
      (tool) => tool.slug === slug && tool.enabled !== false,
    ) ?? null;

  /** A tool missing from the live registry is treated as disabled. */
  const isToolEnabled = (slug: string) => findTool(slug) !== null;

  const adsEnabledFor = (slug: string) =>
    Boolean(
      config.value.settings.adsEnabled &&
      config.value.settings.adsenseClientId &&
      findTool(slug)?.adsEnabled,
    );

  return { config, findTool, isToolEnabled, adsEnabledFor };
};
