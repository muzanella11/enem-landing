import { sanitizeToolsEventPayload } from '@enem-landing/shared-definitions';
import { createApiClient, handleApiError } from '../../utils/api-client';

interface EventBatch {
  items?: { payload?: unknown }[];
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as EventBatch;
  // Second of three payload filters (browser, this BFF, the API): only
  // whitelisted short string keys may leave this server (Story 25).
  const items = (body.items ?? []).map((item) => ({
    ...item,
    payload: sanitizeToolsEventPayload(item.payload) ?? undefined,
  }));
  try {
    return await createApiClient(event).post('/tracking/events', { items });
  } catch (error) {
    return handleApiError(error);
  }
});
