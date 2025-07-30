import { supabase } from '@/utils/superbase';
import { Document } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export function useBookmarks(userId?: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarkedDocuments = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get all documents for this user
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      setDocuments(data || []);
    } catch (err: any) {
      console.error('Error fetching bookmarked documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchBookmarkedDocuments();
    }
  }, [fetchBookmarkedDocuments, userId]);

  const addDocument = useCallback(async (documentData: Partial<Document>) => {
    if (!userId) return { error: 'User not logged in' };

    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          ...documentData,
          user_id: userId
        }])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Refresh the documents
      fetchBookmarkedDocuments();
      return { data, error: null };
    } catch (err: any) {
      console.error('Error adding document:', err);
      return { data: null, error: err };
    }
  }, [fetchBookmarkedDocuments, userId]);

  const deleteDocument = useCallback(async (documentId: string) => {
    if (!userId) return { error: 'User not logged in' };

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);
      
      if (error) {
        throw error;
      }
      
      // Refresh the documents
      fetchBookmarkedDocuments();
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting document:', err);
      return { error: err };
    }
  }, [fetchBookmarkedDocuments, userId]);

  return {
    documents,
    loading,
    error,
    fetchBookmarkedDocuments,
    addDocument,
    deleteDocument
  };
}