export type BlogPostStatus = 'draft' | 'published';

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentDelta: Record<string, unknown>;
  coverImageUrl: string | null;
  status: BlogPostStatus;
  publishedAt: string | null;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  categories: BlogCategory[];
  tags: BlogTag[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedBlogPosts {
  items: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
}
