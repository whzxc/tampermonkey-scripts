/**
 * Shared types used across components and adapters.
 */
import type { MediaType } from '@/types/tmdb';

export interface TmdbInfo {
  id: number;
  mediaType: MediaType;
}
