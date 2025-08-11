import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../auth';
import { Company } from '@/types/company';
import { supabase } from '@/utils/supabase';

export const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCompanies = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setCompanies(data || []);
    } catch (err: any) {
      console.error('Error fetching companies:', err.message);
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createCompany = useCallback(async (companyData: Partial<Company>) => {
    if (!user) return { error: 'User not authenticated' };
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([{ ...companyData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setCompanies(prev => [data, ...prev]);
      return { company: data };
    } catch (err: any) {
      console.error('Error creating company:', err.message);
      return { error: err.message };
    }
  }, [user]);

  const updateCompany = useCallback(async (id: string, updates: Partial<Company>) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCompanies(prev => prev.map(company =>
        company.id === id ? data : company
      ));
      return { company: data };
    } catch (err: any) {
      console.error('Error updating company:', err.message);
      return { error: err.message };
    }
  }, []);

  const deleteCompany = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCompanies(prev => prev.filter(company => company.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting company:', err.message);
      return { error: err.message };
    }
  }, []);

  const getCompanyById = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { company: data };
    } catch (err: any) {
      console.error('Error fetching company:', err.message);
      return { error: err.message };
    }
  }, []);

  const getCompanyByIdPublic = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .eq('is_public', true)
        .single();

      if (error) throw error;
      return { company: data };
    } catch (err: any) {
      console.error('Error fetching public company:', err.message);
      return { error: err.message };
    }
  }, []);

  const getCompanyByUserId = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const company = data[0];
        return { company };
      }
      return { company: null };
    } catch (err: any) {
      console.error('Error fetching company by user ID:', err.message);
      const errorMessage = err.message || 'An error occurred';
      return { error: errorMessage };
    }
  }, []);

  const updateCompanyLogo = useCallback(async (id: string, logoUrl: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({ logo_url: logoUrl })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCompanies(prev => prev.map(company =>
        company.id === id ? data : company
      ));
      return { company: data };
    } catch (err: any) {
      console.error('Error updating company logo:', err.message);
      return { error: err.message };
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchCompanies();
    }
  }, [user?.id, fetchCompanies]);

  return {
    companies,
    loading,
    error,
    fetchCompanies,
    createCompany,
    updateCompany,
    updateCompanyLogo,
    deleteCompany,
    getCompanyById,
    getCompanyByIdPublic,
    getCompanyByUserId,
  };
}; 