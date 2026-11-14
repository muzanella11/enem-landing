import { describe, expect, it } from 'vitest';
import { contactSchema, mapServerErrors } from './contact-form';

const valid = {
  fullname: 'Budi Santoso',
  email: 'budi@example.com',
  phoneNumber: '0812-3456-7890',
  message: 'Halo, saya ingin diskusi soal proyek website.',
};

const issuesFor = (input: Record<string, string>) => {
  const result = contactSchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map(
        (issue: { path: (string | number)[] }) => issue.path[0],
      );
};

describe('contactSchema', () => {
  it('accepts a normal message', () => {
    expect(issuesFor(valid)).toEqual([]);
  });

  it('rejects the probe spam (aiunt / credo / venia)', () => {
    expect(
      issuesFor({
        fullname: 'aiunt',
        email: 'x@school.example',
        phoneNumber: 'credo',
        message: 'venia',
      }),
    ).toEqual(expect.arrayContaining(['phoneNumber', 'message']));
  });

  it('rejects links in the name and too many in the message', () => {
    expect(issuesFor({ ...valid, fullname: 'Deals at spam.xyz' })).toContain(
      'fullname',
    );
    expect(
      issuesFor({
        ...valid,
        message: 'https://a.com https://b.com https://c.com hi',
      }),
    ).toContain('message');
  });
});

describe('mapServerErrors', () => {
  it('maps joined API messages back to fields', () => {
    expect(
      mapServerErrors(
        'phoneNumber must be 8 to 20 digits (spaces and dashes allowed), message must be 10 to 2000 characters',
      ),
    ).toEqual({
      phoneNumber: 'Must be 8 to 20 digits (spaces and dashes allowed)',
      message: 'Must be 10 to 2000 characters',
    });
  });

  it('routes captcha failures to the captcha', () => {
    expect(
      mapServerErrors('captchaToken puzzle not solved - please try again'),
    ).toEqual({
      captcha: 'Puzzle not solved - please try again',
    });
  });

  it('ignores messages it cannot place', () => {
    expect(mapServerErrors('Request failed')).toEqual({});
    expect(mapServerErrors(undefined)).toEqual({});
  });
});
