
export interface Profile {
  id: string; // uuid
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string; // ISO timestamp
} 