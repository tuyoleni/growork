import { Ad, AdStatus } from '@/types';
import { supabase } from '@/utils/superbase';
import { useCallback, useEffect, useState } from 'react';

export function useAds(userId?: string) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAds = useCallback(async (status?: AdStatus) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch ads with basic data
      let query = supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setAds(data || []);
    } catch (err: any) {
      console.error('Error fetching ads:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const addAd = useCallback(async (adData: Partial<Ad>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ads')
        .insert([adData])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Refresh the ads
      fetchAds();
      return { data, error: null };
    } catch (err: any) {
      console.error('Error adding ad:', err);
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [fetchAds]);

  const updateAdStatus = useCallback(async (adId: string, status: AdStatus) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status })
        .eq('id', adId);
      
      if (error) {
        throw error;
      }
      
      // Refresh the ads
      fetchAds();
      return { error: null };
    } catch (err: any) {
      console.error('Error updating ad status:', err);
      return { error: err };
    }
  }, [fetchAds]);

  const recordAdImpression = useCallback(async (adId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('ad_impressions')
        .insert([{ ad_id: adId, user_id: userId }]);
      
      if (error) {
        throw error;
      }
      
      return { error: null };
    } catch (err: any) {
      console.error('Error recording ad impression:', err);
      return { error: err };
    }
  }, []);

  return {
    ads,
    loading,
    error,
    fetchAds,
    addAd,
    updateAdStatus,
    recordAdImpression,
  };
}