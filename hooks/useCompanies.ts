import { Company, CompanyFormData } from '@/types';
import { supabase } from '@/utils/superbase';
import { useCallback, useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export function useCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's companies
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new company
  const createCompany = useCallback(async (companyData: CompanyFormData) => {
    if (!user) {
      setError('No user logged in');
      return { error: 'No user logged in' };
    }

    try {
      setLoading(true);
      setError(null);

      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
          ...companyData,
          user_id: user.id,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Add to local state
      setCompanies(prev => [newCompany, ...prev]);

      return { company: newCompany };
    } catch (err: any) {
      console.error('Error creating company:', err.message);
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update an existing company
  const updateCompany = useCallback(async (companyId: string, companyData: Partial<CompanyFormData>) => {
    if (!user) {
      setError('No user logged in');
      return { error: 'No user logged in' };
    }

    try {
      setLoading(true);
      setError(null);

      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', companyId)
        .eq('user_id', user.id) // Ensure user owns the company
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setCompanies(prev =>
        prev.map(company =>
          company.id === companyId ? updatedCompany : company
        )
      );

      return { company: updatedCompany };
    } catch (err: any) {
      console.error('Error updating company:', err.message);
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Delete a company
  const deleteCompany = useCallback(async (companyId: string) => {
    if (!user) {
      setError('No user logged in');
      return { error: 'No user logged in' };
    }

    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId)
        .eq('user_id', user.id); // Ensure user owns the company

      if (deleteError) {
        throw deleteError;
      }

      // Remove from local state
      setCompanies(prev => prev.filter(company => company.id !== companyId));

      return { success: true };
    } catch (err: any) {
      console.error('Error deleting company:', err.message);
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get a single company by ID
  const getCompanyById = useCallback(async (companyId: string) => {
    if (!user) {
      setError('No user logged in');
      return { error: 'No user logged in' };
    }

    try {
      setLoading(true);
      setError(null);

      const { data: company, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .eq('user_id', user.id) // Ensure user owns the company
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return { company };
    } catch (err: any) {
      console.error('Error fetching company:', err.message);
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get a single company by ID (without user ownership requirement)
  const getCompanyByIdPublic = useCallback(async (companyId: string) => {
    if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
      return { error: 'Invalid company ID provided' };
    }

    try {
      setLoading(true);
      setError(null);

      const { data: companies, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId.trim());

      if (fetchError) {
        console.error('Supabase error fetching company:', fetchError);
        throw fetchError;
      }

      // Check if we got any results
      if (!companies || companies.length === 0) {
        console.warn(`Company not found with ID: ${companyId}`);
        return { error: 'Company not found' };
      }

      // If multiple companies found, return the first one (shouldn't happen with unique IDs)
      if (companies.length > 1) {
        console.warn(`Multiple companies found with ID: ${companyId}, returning first one`);
      }

      const company = companies[0];
      return { company };
    } catch (err: any) {
      console.error('Error fetching company:', err.message);
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update company logo
  const updateCompanyLogo = useCallback(async (companyId: string, logoUrl: string) => {
    if (!user) {
      setError('No user logged in');
      return { error: 'No user logged in' };
    }

    try {
      setLoading(true);
      setError(null);

      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: logoUrl })
        .eq('id', companyId)
        .eq('user_id', user.id) // Ensure user owns the company
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setCompanies(prev =>
        prev.map(company =>
          company.id === companyId ? updatedCompany : company
        )
      );

      return { company: updatedCompany };
    } catch (err: any) {
      console.error('Error updating company logo:', err.message);
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch companies on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchCompanies();
    } else {
      setCompanies([]);
    }
  }, [user, fetchCompanies]);

  return {
    companies,
    loading,
    error,
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    getCompanyById,
    getCompanyByIdPublic,
    updateCompanyLogo,
  };
} 