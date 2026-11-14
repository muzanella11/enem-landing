import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContactSubmissionSenderEntity } from './contact-submission-sender.entity.js';

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

  @Column({ type: 'boolean', default: false })
  isSpam!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  spamReason!: string | null;

  @OneToOne(() => ContactSubmissionSenderEntity, (sender) => sender.submission)
  sender?: ContactSubmissionSenderEntity | null;

  @CreateDateColumn({ precision: 6 })
  createdAt!: Date;
}
