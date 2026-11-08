import { getPublicSettings } from '../../utils/public-settings.js';

/** Public switches from the CMS Settings page (see utils/public-settings). */
export default defineEventHandler(() => getPublicSettings());
