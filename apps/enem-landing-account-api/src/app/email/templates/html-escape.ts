/**
 * Every template here interpolates public-form input (contact submission
 * fullname/email/phoneNumber/message) straight into an HTML email body -
 * unlike mau-apps' templates, which mostly render internally-trusted
 * transaction data. Escape before interpolating, or a submitter can inject
 * arbitrary HTML/links into whatever inbox renders the notification.
 */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
