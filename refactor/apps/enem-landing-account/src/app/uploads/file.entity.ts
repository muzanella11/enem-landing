import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Index('file_app_purpose_idx', ['app', 'purpose'])
@Index('file_uploader_id_idx', ['uploaderId'])
@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 64 })
  app!: string;

  @Column({ length: 64 })
  purpose!: string;

  @Column({ length: 36, nullable: true })
  uploaderId?: string;

  @Column({ length: 128 })
  mime!: string;

  @Column('int')
  size!: number;

  @Column({ length: 512 })
  key!: string;

  @Column({ length: 1024 })
  url!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
