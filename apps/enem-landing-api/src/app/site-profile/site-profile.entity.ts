import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { SocialLink } from '@enem-landing/shared-types';

/** Single-row config — see SiteProfileService for the get-or-create-default logic. */
@Entity('site_profile')
export class SiteProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: '' })
  heroTitle!: string;

  @Column({ default: '' })
  heroSubtitle!: string;

  @Column({ type: 'text', default: '' })
  bio!: string;

  @Column({ default: '' })
  avatarUrl!: string;

  @Column('simple-json')
  socialLinks!: SocialLink[];

  @UpdateDateColumn()
  updatedAt!: Date;
}
