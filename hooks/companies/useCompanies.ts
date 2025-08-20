import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
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

  // Test function to check RLS access
  const testRLSAccess = useCallback(async () => {
    console.log('🔍 Testing RLS access to companies table...');

    // Test 1: Basic select
    const { data: test1, error: error1 } = await supabase
      .from('companies')
      .select('count')
      .limit(1);
    console.log('🔍 Test 1 - Basic select:', error1 ? 'FAILED' : 'SUCCESS', error1?.message);

    // Test 2: Select with user filter
    const { data: test2, error: error2 } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user?.id || '');
    console.log('🔍 Test 2 - User filter:', error2 ? 'FAILED' : 'SUCCESS', error2?.message);

    // Test 3: Select by specific ID
    const { data: test3, error: error3 } = await supabase
      .from('companies')
      .select('*')
      .eq('id', '16905793-ab80-4c66-a250-d4768ff2d717');
    console.log('🔍 Test 3 - Specific ID:', error3 ? 'FAILED' : 'SUCCESS', error3?.message);

    // Test 4: Check if RLS is enabled
    const { data: test4, error: error4 } = await supabase
      .rpc('check_rls_enabled', { table_name: 'companies' });
    console.log('🔍 Test 4 - RLS check:', error4 ? 'FAILED' : 'SUCCESS', error4?.message);
  }, [user?.id]);

  const getCompanyById = useCallback(async (id: string) => {
    try {
      console.log('🔍 getCompanyById: Looking for company with ID:', id);
      console.log('🔍 getCompanyById: Full ID value:', JSON.stringify(id));
      console.log('🔍 getCompanyById: Current user ID:', user?.id);

      // First, let's check if the company exists at all
      const { count, error: countError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('id', id);

      if (countError) {
        console.error('❌ getCompanyById: Count error:', countError);
      } else {
        console.log('🔍 getCompanyById: Found', count, 'companies with this ID');
      }

      // Let's also check how many companies exist in total
      const { count: totalCount, error: totalError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.error('❌ getCompanyById: Total count error:', totalError);
      } else {
        console.log('🔍 getCompanyById: Total companies in database:', totalCount);
      }

      // Let's also check all companies to see what's in the database
      const { data: allCompanies, error: allCompaniesError } = await supabase
        .from('companies')
        .select('*');
      if (allCompaniesError) {
        console.error('❌ getCompanyById: Error fetching all companies:', allCompaniesError);
      } else {
        console.log('🔍 getCompanyById: All companies in database:', JSON.stringify(allCompanies, null, 2));
      }

      // Let's also try a direct query for the specific company
      const { data: specificCompany, error: specificError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id);

      if (specificError) {
        console.error('❌ getCompanyById: Error fetching specific company:', specificError);
      } else {
        console.log('🔍 getCompanyById: Direct query for company:', JSON.stringify(specificCompany, null, 2));
      }

      // Let's also check current user's companies
      if (user?.id) {
        const { data: userCompanies, error: userCompaniesError } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id);

        if (userCompaniesError) {
          console.error('❌ getCompanyById: Error fetching user companies:', userCompaniesError);
        } else {
          console.log('🔍 getCompanyById: Current user companies:', JSON.stringify(userCompanies, null, 2));
        }
      }

      // Test RLS access
      await testRLSAccess();

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      console.log('🔍 getCompanyById: Query result - data:', JSON.stringify(data, null, 2));
      console.log('🔍 getCompanyById: Query result - error:', JSON.stringify(error, null, 2));

      if (error) {
        console.error('❌ getCompanyById: Database error:', error);
        throw error;
      }

      if (data) {
        console.log('✅ getCompanyById: Company found:', data);
        return { company: data };
      } else {
        console.log('⚠️ getCompanyById: No company found with ID:', id);
        return { company: null };
      }
    } catch (err: any) {
      console.error('❌ getCompanyById: Error:', err.message);
      return { error: err.message };
    }
  }, []);

  const getCompanyByIdPublic = useCallback(async (id: string) => {
    try {
      console.log('🔍 Fetching company by ID:', id);

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Fetch company posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('type', 'job')
          .eq('criteria->>companyId', id)
          .order('created_at', { ascending: false });

        const companyWithPosts = {
          ...data,
          posts: postsData || []
        };

        console.log('✅ Company found with posts:', companyWithPosts);
        return { company: companyWithPosts };
      }

      return { company: null };

    } catch (err: any) {
      console.error('Error fetching company:', err.message);
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
    testRLSAccess,
  };
}; 