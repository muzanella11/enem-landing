import { Column, Entity, PrimaryColumn } from 'typeorm';

/** One gold price per day (Story 38) - the free sources have no history, so it is kept here. */
@Entity('tools_gold_prices')
export class GoldPriceEntity {
  /** YYYY-MM-DD (WIB). */
  @PrimaryColumn({ type: 'varchar', length: 10 })
  tanggal!: string;

  /** Spot gold, rupiah per gram. */
  @Column({ type: 'int' })
  pricePerGram!: number;

  @Column({ type: 'datetime', precision: 6 })
  sourceUpdatedAt!: Date;
}
