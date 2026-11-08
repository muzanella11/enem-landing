import { Controller, Get } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service.js';

/**
 * Unauthenticated read of the non-secret switches in
 * `PUBLIC_SETTING_KEYS` (e.g. Cloudflare Image Transformations), for
 * enem-landing-web. Everything else in system settings stays admin-only.
 */
@Controller('system-settings/public')
export class PublicSystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  async get() {
    const data = await this.systemSettingsService.getPublic();
    return { statusCode: 200, message: 'Success', data };
  }
}
