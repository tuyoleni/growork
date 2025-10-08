import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../auth";
import { Company } from "@/types/company";
import { supabase } from "@/utils/supabase";

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
          .from("companies")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setCompanies(data || []);
      } else {
        // For non-authenticated users, show empty state
        setCompanies([]);
      }
    } catch (err: any) {
      console.error("Error fetching companies:", err.message);
      const errorMessage = err.message || "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createCompany = useCallback(
    async (companyData: Partial<Company>) => {
      if (!user) return { error: "User not authenticated" };
      try {
        // Debug: Log the company data being sent
        console.log(
          "🔍 Creating company with data:",
          JSON.stringify(companyData, null, 2)
        );

        // Validate size field - if provided, it must be valid
        if (
          companyData.size !== undefined &&
          companyData.size !== null &&
          companyData.size !== ""
        ) {
          const validSizes = ["1-10", "11-50", "51-200", "201-500", "500+"];
          if (!validSizes.includes(companyData.size)) {
            console.error("❌ Invalid company size:", companyData.size);
            return {
              error: `Invalid company size. Must be one of: ${validSizes.join(
                ", "
              )}`,
            };
          }
        }

        // Clean the data - remove empty strings and set to null if needed
        const cleanedData = {
          ...companyData,
          size:
            companyData.size && companyData.size.trim()
              ? companyData.size
              : null,
          user_id: user.id,
        };

        console.log(
          "🔍 Cleaned company data:",
          JSON.stringify(cleanedData, null, 2)
        );

        const { data, error } = await supabase
          .from("companies")
          .insert([cleanedData])
          .select()
          .single();

        if (error) {
          console.error("❌ Database error:", error);
          throw error;
        }

        console.log("✅ Company created successfully:", data);
        setCompanies((prev) => [data, ...prev]);
        return { company: data };
      } catch (err: any) {
        console.error("Error creating company:", err.message);
        return { error: err.message };
      }
    },
    [user]
  );

  const updateCompany = useCallback(
    async (id: string, updates: Partial<Company>) => {
      try {
        // Debug: Log the update data being sent
        console.log(
          "🔍 Updating company with data:",
          JSON.stringify(updates, null, 2)
        );

        // Validate size field - if provided, it must be valid
        if (
          updates.size !== undefined &&
          updates.size !== null &&
          updates.size !== ""
        ) {
          const validSizes = ["1-10", "11-50", "51-200", "201-500", "500+"];
          if (!validSizes.includes(updates.size)) {
            console.error("❌ Invalid company size:", updates.size);
            return {
              error: `Invalid company size. Must be one of: ${validSizes.join(
                ", "
              )}`,
            };
          }
        }

        // Clean the data - remove empty strings and set to null if needed
        const cleanedUpdates = {
          ...updates,
          size: updates.size && updates.size.trim() ? updates.size : null,
        };

        console.log(
          "🔍 Cleaned update data:",
          JSON.stringify(cleanedUpdates, null, 2)
        );

        const { data, error } = await supabase
          .from("companies")
          .update(cleanedUpdates)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error("❌ Database error:", error);
          throw error;
        }

        console.log("✅ Company updated successfully:", data);
        setCompanies((prev) =>
          prev.map((company) => (company.id === id ? data : company))
        );
        return { company: data };
      } catch (err: any) {
        console.error("Error updating company:", err.message);
        return { error: err.message };
      }
    },
    []
  );

  const deleteCompany = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("companies").delete().eq("id", id);

      if (error) throw error;

      setCompanies((prev) => prev.filter((company) => company.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error("Error deleting company:", err.message);
      return { error: err.message };
    }
  }, []);

  const getCompanyById = useCallback(async (id: string) => {
    try {
      console.log("🔍 getCompanyById: Looking for company with ID:", id);

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      console.log(
        "🔍 getCompanyById: Query result - data:",
        JSON.stringify(data, null, 2)
      );
      console.log(
        "🔍 getCompanyById: Query result - error:",
        JSON.stringify(error, null, 2)
      );

      if (error) {
        console.error("❌ getCompanyById: Database error:", error);
        throw error;
      }

      if (data) {
        console.log("✅ getCompanyById: Company found:", data);
        return { company: data };
      } else {
        console.log("⚠️ getCompanyById: No company found with ID:", id);
        return { company: null };
      }
    } catch (err: any) {
      console.error("❌ getCompanyById: Error:", err.message);
      return { error: err.message };
    }
  }, []);

  const getCompanyByIdPublic = useCallback(async (id: string) => {
    try {
      console.log("🔍 Fetching company by ID:", id);

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Fetch posts that belong to this company
        console.log(
          "🔍 Fetching posts for company:",
          data.name,
          "with ID:",
          id
        );

        // First, let's see what posts exist and their criteria
        const { data: allPosts, error: allPostsError } = await supabase
          .from("posts")
          .select("id, title, criteria, type")
          .order("created_at", { ascending: false })
          .limit(10);

        if (allPostsError) {
          console.error("Error fetching all posts:", allPostsError);
        } else {
          console.log("📋 Sample posts in database:");
          allPosts?.forEach((post, index) => {
            console.log(`📋 Post ${index + 1}:`, {
              id: post.id,
              title: post.title,
              type: post.type,
              criteria: post.criteria,
            });
          });
        }

        // Now fetch posts for this specific company
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .eq("criteria->>companyId", id)
          .order("created_at", { ascending: false });

        if (postsError) {
          console.error("Error fetching company posts:", postsError);
        }

        console.log("📋 Found posts for company:", postsData?.length || 0);
        if (postsData && postsData.length > 0) {
          postsData.forEach((post, index) => {
            console.log(`📋 Company post ${index + 1}:`, {
              id: post.id,
              title: post.title,
              type: post.type,
              criteria: post.criteria,
            });
          });
        }

        const companyWithPosts = {
          ...data,
          posts: postsData || [],
        };

        console.log("✅ Company found with posts:", companyWithPosts);
        return { company: companyWithPosts };
      }

      return { company: null };
    } catch (err: any) {
      console.error("Error fetching company:", err.message);
      return { error: err.message };
    }
  }, []);

  const getCompanyByUserId = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "approved")
        .order("created_at", { ascending: false }) // Get the most recent approved company
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const company = data[0];
        return { company };
      }
      return { company: null };
    } catch (err: any) {
      console.error("Error fetching company by user ID:", err.message);
      const errorMessage = err.message || "An error occurred";
      return { error: errorMessage };
    }
  }, []);

  const getAllCompaniesByUserId = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { companies: data || [] };
    } catch (err: any) {
      console.error("Error fetching all companies by user ID:", err.message);
      return { error: err.message };
    }
  }, []);

  // Debug function to check company table structure
  const debugCompanyTable = useCallback(async () => {
    try {
      console.log("=== DEBUG: Checking companies table structure ===");

      // Check total count
      const { count, error: countError } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true });

      if (countError) {
        console.error("Error getting company count:", countError);
        return;
      }

      console.log("Total companies in table:", count);

      // Check for any companies with duplicate IDs
      const { data: allCompanies, error: allError } = await supabase
        .from("companies")
        .select("id, name, status, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (allError) {
        console.error("Error getting sample companies:", allError);
        return;
      }

      console.log("Sample companies:", allCompanies);

      // Check for companies with specific statuses
      const { data: pendingCompanies, error: pendingError } = await supabase
        .from("companies")
        .select("id, name, status")
        .eq("status", "pending");

      if (pendingError) {
        console.error("Error getting pending companies:", pendingError);
      } else {
        console.log("Pending companies count:", pendingCompanies?.length || 0);
      }

      const { data: approvedCompanies, error: approvedError } = await supabase
        .from("companies")
        .select("id, name, status")
        .eq("status", "approved");

      if (approvedError) {
        console.error("Error getting approved companies:", approvedError);
      } else {
        console.log(
          "Approved companies count:",
          approvedCompanies?.length || 0
        );
      }

      console.log("=== END DEBUG ===");
    } catch (err: any) {
      console.error("Error in debug function:", err);
    }
  }, []);

  const updateCompanyLogo = useCallback(async (id: string, logoUrl: string) => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .update({ logo_url: logoUrl })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setCompanies((prev) =>
        prev.map((company) => (company.id === id ? data : company))
      );
      return { company: data };
    } catch (err: any) {
      console.error("Error updating company logo:", err.message);
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
