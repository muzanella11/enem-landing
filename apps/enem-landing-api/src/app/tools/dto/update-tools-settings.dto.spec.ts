import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { UpdateToolsSettingsDto } from './update-tools-settings.dto';

const errorsFor = async (body: Record<string, unknown>) =>
  (await validate(plainToInstance(UpdateToolsSettingsDto, body))).map(
    (error) => error.property,
  );

describe('UpdateToolsSettingsDto (Story 56 blog ads)', () => {
  it('accepts the blog switch and a numeric article slot', async () => {
    expect(
      await errorsFor({
        blogAdsEnabled: true,
        adsenseSlotArticle: '1234567890',
      }),
    ).toEqual([]);
  });

  it('accepts clearing the article slot', async () => {
    expect(await errorsFor({ adsenseSlotArticle: null })).toEqual([]);
  });

  it('rejects a non-numeric article slot and a non-boolean switch', async () => {
    expect(
      await errorsFor({ blogAdsEnabled: 'yes', adsenseSlotArticle: 'abc' }),
    ).toEqual(expect.arrayContaining(['blogAdsEnabled', 'adsenseSlotArticle']));
  });
});
