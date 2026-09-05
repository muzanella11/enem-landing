import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExperienceEntity } from './experience.entity.js';

@Entity('projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  experienceId!: string;

  @ManyToOne(() => ExperienceEntity, (experience) => experience.projects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'experienceId' })
  experience!: ExperienceEntity;

  @Column()
  title!: string;

  @Column('simple-json')
  image!: string[];

  /**
   * Null means "no explicit choice" - consumers (portfolio list) fall back
   * to `image[0]` themselves rather than this column ever storing a
   * computed value, so the CMS can still tell an explicit pick apart from
   * the fallback.
   */
  @Column({ type: 'varchar', length: 2048, nullable: true })
  mainImage!: string | null;

  @Column({ default: '' })
  url!: string;

  @Column()
  year!: string;

  @Column('text')
  description!: string;

  @Column('simple-json')
  technologies!: string[];

  @CreateDateColumn({ precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ precision: 6 })
  updatedAt!: Date;
}
