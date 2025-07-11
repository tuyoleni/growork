import { AdStatus } from './enums';

export interface Ad {
  id: string;
  post_id: string;
  user_id: string;
  budget: number | null;
  spent: number;
  priority: number;
  status: AdStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface AdImpression {
  id: string;
  ad_id: string;
  user_id: string;
  shown_at: string;
} 