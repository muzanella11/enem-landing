import {
  createApiClient,
  handleApiError,
  TOOLS_SITE,
} from '../../utils/api-client';

export default defineEventHandler(async () => {
  try {
    // Always the tools site's config - the API also forces recording off
    // for this site, whatever the stored toggle says.
    return await createApiClient().get('/tracking/config', {
      params: { site: TOOLS_SITE },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
