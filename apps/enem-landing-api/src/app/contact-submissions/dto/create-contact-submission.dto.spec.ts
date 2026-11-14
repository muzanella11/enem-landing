import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateContactSubmissionDto } from './create-contact-submission.dto.js';

const valid = {
  fullname: 'Budi Santoso',
  email: 'budi@example.com',
  phoneNumber: '0812-3456-7890',
  message: 'Halo, saya ingin diskusi soal proyek website.',
};

const errorsFor = async (input: Record<string, unknown>) => {
  const dto = plainToInstance(CreateContactSubmissionDto, input);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return {
    dto,
    fields: errors.map((error) => error.property),
    messages: errors.flatMap((error) => Object.values(error.constraints ?? {})),
  };
};

describe('CreateContactSubmissionDto', () => {
  it('accepts a normal submission and normalises it', async () => {
    const { dto, fields } = await errorsFor({
      ...valid,
      fullname: '  Budi Santoso ',
      email: ' Budi@Example.COM ',
    });
    expect(fields).toEqual([]);
    expect(dto.fullname).toBe('Budi Santoso');
    expect(dto.email).toBe('budi@example.com');
  });

  it('rejects the 2026-11-14 probe spam (aiunt / credo / venia)', async () => {
    const { fields } = await errorsFor({
      fullname: 'aiunt',
      email: 'someone@school.example',
      phoneNumber: 'credo',
      message: 'venia',
    });
    expect(fields).toEqual(expect.arrayContaining(['phoneNumber', 'message']));
  });

  it('rejects links in the name', async () => {
    const { fields } = await errorsFor({
      ...valid,
      fullname: 'Get rich at spam.xyz',
    });
    expect(fields).toContain('fullname');
  });

  it('allows up to two links in the message but not three', async () => {
    expect(
      (
        await errorsFor({
          ...valid,
          message: 'see https://a.com and https://b.com',
        })
      ).fields,
    ).toEqual([]);
    expect(
      (
        await errorsFor({
          ...valid,
          message: 'see https://a.com https://b.com https://c.com',
        })
      ).fields,
    ).toContain('message');
  });

  it('rejects HTML and BBCode links', async () => {
    const { fields } = await errorsFor({
      ...valid,
      message: 'hello there [url=http://x]click[/url]',
    });
    expect(fields).toContain('message');
  });

  it('prefixes every message with its field and avoids commas', async () => {
    const { messages } = await errorsFor({
      fullname: 'x',
      email: 'nope',
      phoneNumber: 'abc',
      message: 'short',
    });
    expect(messages.length).toBeGreaterThan(0);
    for (const message of messages) {
      expect(message).toMatch(/^(fullname|email|phoneNumber|message) /);
      expect(message).not.toContain(',');
    }
  });

  it('accepts valid client signals and rejects unknown ones', async () => {
    expect(
      (
        await errorsFor({
          ...valid,
          client: { timezone: 'Asia/Jakarta', pastedFields: ['message'] },
        })
      ).fields,
    ).toEqual([]);
    expect((await errorsFor({ ...valid, website: 'bot' })).fields).toContain(
      'website',
    );
  });
});
