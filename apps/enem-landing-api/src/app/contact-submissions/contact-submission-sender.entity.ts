import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContactSubmissionEntity } from './contact-submission.entity.js';

/**
 * Who sent a contact submission, for spam review in the CMS. Kept apart
 * from the submission itself so the retention job can drop the whole row
 * after 90 days while the message stays. Admin-only; never emailed.
 */
@Entity('contact_submission_senders')
export class ContactSubmissionSenderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  submissionId!: string;

  @OneToOne(() => ContactSubmissionEntity, (submission) => submission.sender, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'submissionId' })
  submission?: ContactSubmissionEntity;

  @Index()
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  countryCode!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  cfRay!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  asn!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  isp!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  org!: string | null;

  @Column({ type: 'boolean', nullable: true })
  isProxy!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  isHosting!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  isTor!: boolean | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  acceptLanguage!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  referer!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  timezone!: string | null;

  /** Browser timezone isn't used in the IP's country (a VPN hint). */
  @Column({ type: 'boolean', nullable: true })
  timezoneMismatch!: boolean | null;

  @Column({ type: 'varchar', length: 35, nullable: true })
  language!: string | null;

  @Column({ type: 'int', nullable: true })
  screenWidth!: number | null;

  @Column({ type: 'int', nullable: true })
  screenHeight!: number | null;

  @Column({ type: 'int', nullable: true })
  fillDurationMs!: number | null;

  @Column({ type: 'int', nullable: true })
  keystrokeCount!: number | null;

  @Column({ type: 'simple-array', nullable: true })
  pastedFields!: string[] | null;

  @Column({ type: 'boolean', nullable: true })
  hadPointerMovement!: boolean | null;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  visitorId!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sessionId!: string | null;

  /** The tracker has at least one session for `visitorId`. */
  @Column({ type: 'boolean', nullable: true })
  hasTrackedVisit!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  emailHasMx!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  isDisposableEmail!: boolean | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  phoneCountry!: string | null;

  @Column({ type: 'boolean', nullable: true })
  phoneValid!: boolean | null;

  @Index()
  @CreateDateColumn({ precision: 6 })
  createdAt!: Date;
}
