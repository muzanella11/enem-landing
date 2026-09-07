import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('blog_categories')
export class BlogCategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;
}
