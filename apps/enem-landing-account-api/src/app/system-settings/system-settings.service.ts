import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ENV_FALLBACK_KEYS } from './system-settings.constants.js';
import { SystemSettingEntity } from './system-setting.entity.js';

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectRepository(SystemSettingEntity)
    private readonly repo: Repository<SystemSettingEntity>,
  ) {}

  async getAll(): Promise<Record<string, string>> {
    const rows = await this.repo.find();
    const settings = Object.fromEntries(
      rows.map((row) => [row.key, row.value ?? '']),
    );

    for (const key of ENV_FALLBACK_KEYS) {
      if (!settings[key]) settings[key] = process.env[key] ?? '';
    }

    return settings;
  }

  async get(key: string): Promise<string> {
    const row = await this.repo.findOne({ where: { key } });
    return row?.value ?? process.env[key] ?? '';
  }

  async upsertMany(settings: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      const existing = await this.repo.findOne({ where: { key } });
      if (existing) {
        await this.repo.update(existing.id, { value: String(value) });
      } else {
        await this.repo.save(this.repo.create({ key, value: String(value) }));
      }
    }
  }
}
