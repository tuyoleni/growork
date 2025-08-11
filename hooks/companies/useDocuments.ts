import { Document, DocumentType } from '@/types';
import { supabase } from '@/utils/supabase';
import { useCallback, useEffect, useState } from 'react';

export function useDocuments(userId?: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (type?: DocumentType) => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('documents')
        .select('*')
        .order('uploaded_at', { ascending: false });
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      if (type) {
        query = query.eq('type', type);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setDocuments(data || []);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchDocuments();
    }
  }, [fetchDocuments, userId]);

  const addDocument = useCallback(async (documentData: Partial<Document>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Refresh the documents
      fetchDocuments();
      return { data, error: null };
    } catch (err: any) {
      console.error('Error adding document:', err);
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [fetchDocuments]);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);
      
      if (error) {
        throw error;
      }
      
      // Refresh the documents
      fetchDocuments();
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting document:', err);
      return { error: err };
    }
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    addDocument,
    deleteDocument,
  };
}