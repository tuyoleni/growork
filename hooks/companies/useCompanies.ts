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
    try {
      setLoading(true);
      setError(null);

      if (user) {
        // Fetch user's companies if authenticated
        const { data, error: fetchError } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setCompanies(data || []);
      } else {
        // For non-authenticated users, show empty state
        setCompanies([]);
      }
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
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        console.error('Invalid company ID format:', id);
        return { error: 'Invalid company ID format' };
      }

      // First try to get approved company
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .eq('status', 'approved')
        .limit(1); // Use limit(1) instead of maybeSingle to avoid multiple rows errorr

      if (error) throw error;

      // If approved company found, return it
      if (data && data.length > 0) {
        return { company: data[0] };
      }

      // If no approved company found, try to get any company with this ID
      console.log('No approved company found, trying to get any company with ID:', id);
      const { data: anyCompany, error: anyCompanyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .limit(1); // Use limit(1) to avoid multiple rows error

      if (anyCompanyError) throw anyCompanyError;

      if (anyCompany && anyCompany.length > 0) {
        console.log('Found company with status:', anyCompany[0].status);
        return { company: anyCompany[0] };
      }

      // No company found at all
      return { company: null };

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
        .eq('status', 'approved')
        .order('created_at', { ascending: false }) // Get the most recent approved company
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

  const getAllCompaniesByUserId = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { companies: data || [] };
    } catch (err: any) {
      console.error('Error fetching all companies by user ID:', err.message);
      return { error: err.message };
    }
  }, []);

  // Debug function to check company table structure
  const debugCompanyTable = useCallback(async () => {
    try {
      console.log('=== DEBUG: Checking companies table structure ===');

      // Check total count
      const { count, error: countError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error getting company count:', countError);
        return;
      }

      console.log('Total companies in table:', count);

      // Check for any companies with duplicate IDs
      const { data: allCompanies, error: allError } = await supabase
        .from('companies')
        .select('id, name, status, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (allError) {
        console.error('Error getting sample companies:', allError);
        return;
      }

      console.log('Sample companies:', allCompanies);

      // Check for companies with specific statuses
      const { data: pendingCompanies, error: pendingError } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('status', 'pending');

      if (pendingError) {
        console.error('Error getting pending companies:', pendingError);
      } else {
        console.log('Pending companies count:', pendingCompanies?.length || 0);
      }

      const { data: approvedCompanies, error: approvedError } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('status', 'approved');

      if (approvedError) {
        console.error('Error getting approved companies:', approvedError);
      } else {
        console.log('Approved companies count:', approvedCompanies?.length || 0);
      }

      console.log('=== END DEBUG ===');

    } catch (err: any) {
      console.error('Error in debug function:', err);
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
    fetchCompanies();
  }, [fetchCompanies]);

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
    getAllCompaniesByUserId,
    debugCompanyTable,
  };
}; 