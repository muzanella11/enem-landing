import { describe, expect, it } from 'vitest';
import { ContactSubmissionConfirmationTemplate } from './contact-submission-confirmation.template.js';

describe('ContactSubmissionConfirmationTemplate', () => {
  it('never echoes the submitted message', () => {
    const payload = {
      fullname: 'Budi',
      message: 'Buy cheap followers at spam.example',
    };
    const html = new ContactSubmissionConfirmationTemplate(
      payload,
    ).generateHtml();
    expect(html).toContain('Budi');
    expect(html).not.toContain('spam.example');
  });

  it('caps a long name at 50 characters', () => {
    const fullname = `${'A'.repeat(60)} visit spam.example`;
    const html = new ContactSubmissionConfirmationTemplate({
      fullname,
    }).generateHtml();
    expect(html).toContain(`${'A'.repeat(50)}...`);
    expect(html).not.toContain('spam.example');
  });

  it('escapes HTML in the name', () => {
    const html = new ContactSubmissionConfirmationTemplate({
      fullname: '<b>x</b>',
    }).generateHtml();
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
