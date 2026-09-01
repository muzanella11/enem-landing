import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectEntity } from './project.entity.js';

@Entity('experiences')
export class ExperienceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  company!: string;

  @Column()
  position!: string;

  @Column()
  location!: string;

  @Column('text')
  description!: string;

  @Column('text')
  roleSummary!: string;

  /** Free-text period (e.g. "November 2021 - Now"), not a structured date range. */
  @Column()
  workingPeriode!: string;

  @Column('simple-json')
  experienceGained!: string[];

  @OneToMany(() => ProjectEntity, (project) => project.experience, {
    cascade: ['insert', 'update'],
  })
  projects!: ProjectEntity[];

  // `precision: 6` - MySQL's default `datetime` has only 1-second
  // resolution, which made bulk-created rows (e.g. a data migration) sort
  // unpredictably by `findAll()`'s `order: { createdAt: 'ASC' }` when
  // several land within the same second.
  @CreateDateColumn({ precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ precision: 6 })
  updatedAt!: Date;
}
