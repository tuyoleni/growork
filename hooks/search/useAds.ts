import { useState, useCallback } from 'react';
import { supabase } from '@/utils/supabase';

export interface Ad {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  link_url?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
  impressions: number;
  clicks: number;
}

export function useAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAds = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setAds(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ads');
    } finally {
      setLoading(false);
    }
  }, []);

  const addAd = useCallback(async (adData: Partial<Ad>) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('ads')
        .insert([adData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setAds(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add ad');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const recordAdImpression = useCallback(async (adId: string, userId: string) => {
    try {
      // Record impression in analytics table
      const { error: impressionError } = await supabase
        .from('ad_impressions')
        .insert([{
          ad_id: adId,
          user_id: userId,
          timestamp: new Date().toISOString(),
        }]);

      if (impressionError) {
        console.error('Failed to record ad impression:', impressionError);
      }

      // Update ad impressions count
      const { error: updateError } = await supabase
        .from('ads')
        .update({ impressions: supabase.rpc('increment') })
        .eq('id', adId);

      if (updateError) {
        console.error('Failed to update ad impressions:', updateError);
      }
    } catch (err) {
      console.error('Error recording ad impression:', err);
    }
  }, []);

  return {
    ads,
    loading,
    error,
    fetchAds,
    addAd,
    recordAdImpression,
  };
} 