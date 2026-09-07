import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BlogCategoryEntity } from './blog-category.entity.js';
import { BlogTagEntity } from './blog-tag.entity.js';

export type BlogPostStatus = 'draft' | 'published';

@Entity('blog_posts')
export class BlogPostEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  excerpt!: string | null;

  @Column('json')
  contentDelta!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  coverImageUrl!: string | null;

  @Column({ type: 'varchar', length: 16, default: 'draft' })
  status!: BlogPostStatus;

  /** Set once, the first time `status` transitions to `published` - left untouched on later edits (see `BlogPostsService.update`). */
  @Column({ type: 'datetime', precision: 6, nullable: true })
  publishedAt!: Date | null;

  @Column({ default: '' })
  metaTitle!: string;

  @Column({ type: 'text', default: '' })
  metaDescription!: string;

  @Column({ default: '' })
  ogImageUrl!: string;

  @ManyToMany(() => BlogCategoryEntity)
  @JoinTable({
    name: 'blog_post_categories',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' },
  })
  categories!: BlogCategoryEntity[];

  @ManyToMany(() => BlogTagEntity)
  @JoinTable({
    name: 'blog_post_tags',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags!: BlogTagEntity[];

  @CreateDateColumn({ precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ precision: 6 })
  updatedAt!: Date;
}
