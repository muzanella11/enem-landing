import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('blog_tags')
export class BlogTagEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;
}
