import type { Page, Request } from '@playwright/test';

/**
 * Records every request body leaving the page, so a spec can assert that
 * no user input (salary, file bytes) was sent anywhere (Stories 20/23).
 */
export const recordRequests = (page: Page) => {
  const requests: { url: string; body: string }[] = [];
  page.on('request', (request: Request) => {
    requests.push({ url: request.url(), body: request.postData() ?? '' });
  });
  return {
    requests,
    containing: (needle: string) =>
      requests.filter(
        (entry) => entry.url.includes(needle) || entry.body.includes(needle),
      ),
  };
};

/** Hides the consent banner so it never covers the controls under test. */
export const acceptConsent = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('elt_consent', 'denied');
    } catch {
      // ignore
    }
  });
};

/** Smallest valid PDF with `pages` blank pages, built in memory. */
export const makePdf = (pages: number): Buffer => {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${Array.from({ length: pages }, (_, index) => `${3 + index} 0 R`).join(' ')}] /Count ${pages} >>`,
    ...Array.from(
      { length: pages },
      () => '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>',
    ),
  ];
  let output = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(output.length);
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = output.length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  output += offsets
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(output, 'latin1');
};

/** 8x8 red PNG. */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFWEXHbQSACj/P8Fu7N9hAAAAAElFTkSuQmCC',
  'base64',
);

/** Navigates and waits until the Vue app has hydrated (see app.vue). */
export const gotoReady = async (page: Page, path: string) => {
  await page.goto(path);
  await page
    .locator('html[data-hydrated="true"]')
    .waitFor({ state: 'attached' });
};
