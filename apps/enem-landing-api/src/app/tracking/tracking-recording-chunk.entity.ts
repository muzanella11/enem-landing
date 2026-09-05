import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tracking_recording_chunks')
export class TrackingRecordingChunkEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sessionId!: string;

  @Column({ type: 'int' })
  sequence!: number;

  /** `FileEntity.id` in enem-landing-account-api - needed to delete the R2 object later via `DELETE /uploads/internal/:id`. */
  @Column()
  uploadId!: string;

  @Column()
  url!: string;

  @Column({ type: 'int' })
  sizeBytes!: number;

  @Column({ type: 'datetime', precision: 6 })
  occurredAt!: Date;
}
