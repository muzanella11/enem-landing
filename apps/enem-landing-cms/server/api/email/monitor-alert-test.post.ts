import {
  createAccountApiClient,
  handleApiError,
} from '../../utils/api-client.js';

/** "Kirim email alert tes": a sample monitor alert to ADMIN_NOTIFICATION_EMAIL. */
export default defineEventHandler(async (event) => {
  try {
    return await createAccountApiClient(event).post(
      '/email/monitor-alert/test',
    );
  } catch (error) {
    return handleApiError(error);
  }
});
