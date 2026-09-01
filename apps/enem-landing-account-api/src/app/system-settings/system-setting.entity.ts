import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSettingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string;

  @Column({ type: 'text', nullable: true })
  value?: string;
}
