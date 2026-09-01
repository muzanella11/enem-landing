import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('skills')
export class SkillEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  category!: string;

  @Column({ type: 'varchar', nullable: true })
  level!: string | null;

  @Column({ type: 'varchar', nullable: true })
  icon!: string | null;
}
