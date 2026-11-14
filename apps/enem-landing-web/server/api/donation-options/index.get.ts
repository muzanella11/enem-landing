import type { ToolsPublicConfig } from '@enem-landing/shared-types';
import { createApiClient } from '../../utils/api-client.js';

type PublicDonationOption = ToolsPublicConfig['donationOptions'][number];

/**
 * Donation options ("Buy me a coffee") for blog articles. Same options the
 * CMS manages for the tools site (the public config only lists enabled
 * ones), so they are configured in one place. Never fails the page: any
 * API error resolves to an empty list and the article shows no box.
 */
export default defineEventHandler(
  async (event): Promise<PublicDonationOption[]> => {
    try {
      const config = (await createApiClient(event).get(
        '/tools/config',
      )) as unknown as ToolsPublicConfig;
      return config.donationOptions.filter(
        (option) => option.url || option.qrisImageUrl,
      );
    } catch {
      return [];
    }
  },
);
