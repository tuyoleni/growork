import { ApplicationStatus } from './enums';

export interface Application {
  id: string;
  user_id: string;
  post_id: string;
  resume_id: string | null;
  cover_letter_id: string | null;
  resume_url: string | null;
  cover_letter: string | null;
  status: ApplicationStatus;
  created_at: string;
} 