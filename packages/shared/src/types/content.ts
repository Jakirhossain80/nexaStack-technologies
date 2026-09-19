import type { z } from 'zod';

import type {
  contentListQuerySchema,
  contentStatusTransitionSchema,
  reorderSchema,
} from '../schemas/content.js';

export type ContentListQuery = z.infer<typeof contentListQuerySchema>;
export type ContentStatusTransitionInput = z.infer<typeof contentStatusTransitionSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;

/** The envelope every paginated admin list endpoint returns as its `data`. */
export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
