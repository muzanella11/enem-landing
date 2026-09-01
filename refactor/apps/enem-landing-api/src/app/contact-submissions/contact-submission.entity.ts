import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('contact_submissions')
export class ContactSubmissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fullname!: string;

  @Column()
  email!: string;

  @Column()
  phoneNumber!: string;

  @Column('text')
  message!: string;

  @Column({ type: 'datetime', nullable: true })
  readAt!: Date | null;

  @CreateDateColumn({ precision: 6 })
  createdAt!: Date;
}
