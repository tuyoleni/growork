import { PostType } from './enums';

export interface Post {
  id: string;
  user_id: string;
  type: PostType;
  title: string | null;
  content: string | null;
  image_url: string | null;
  criteria: any | null; // JSONB, can be refined
  created_at: string;
  updated_at: string | null;
  is_sponsored: boolean;
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
} 