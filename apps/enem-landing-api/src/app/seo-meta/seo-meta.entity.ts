import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('seo_meta')
export class SeoMetaEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  pageKey!: string;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column({ default: '' })
  ogImageUrl!: string;
}
