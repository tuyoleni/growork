
export interface Profile {
  id: string; // uuid
  username: string | null;
  name: string;
  surname: string;
  avatar_url: string | null;
  bio: string | null;
  user_type: import('./enums').UserType;
  created_at: string; // ISO timestamp
} 