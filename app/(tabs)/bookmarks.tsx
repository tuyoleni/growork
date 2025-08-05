'use client'
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useApplications } from '@/hooks/useApplications';
import { useDocuments } from '@/hooks/useDocuments';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ScreenContainer from '@/components/ScreenContainer';
import PostCard from '@/components/content/ContentCard';    // or your PostCard component
import CompanyCard from '@/components/cards/CompanyCard';   // you must create this, or use ContentCard variant
import DocumentList from '@/components/content/DocumentList';
import { useThemeColor } from '@/hooks/useThemeColor';
import { CustomOptionStrip } from '@/components/ui';

const BOOKMARK_CATEGORIES = [
  { icon: 'star', label: 'Bookmarked Posts' },
  { icon: 'briefcase', label: 'Companies I Applied To' },
  { icon: 'file-text', label: 'CV Downloads' },
];

export default function Bookmarks() {
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const { user } = useAuth();
  const userId = user?.id;
  const { posts, loading: postsLoading } = usePosts();
  const { bookmarks, loading: bookmarksLoading } = useBookmarks();
  const { applications, loading: applicationsLoading } = useApplications(userId);
  const { documents, loading: docsLoading } = useDocuments(userId);
  const textColor = useThemeColor({}, 'text');

  // 1. Bookmarked posts
  const bookmarkedPosts = useMemo(() => {
    return posts.filter(post => bookmarks.includes(post.id));
  }, [posts, bookmarks]);

  // 2. Companies I applied to (distinct, from posts in applications)
  const appliedCompanyIds = useMemo(() => {
    const postIds = applications.map(a => a.post_id);
    const appPosts = posts.filter(p => postIds.includes(p.id));
    const companyIds = appPosts
      .map(p => p.criteria?.company)
      .filter(Boolean) as string[];
    return Array.from(new Set(companyIds));
  }, [applications, posts]);
  // Optionally, retrieve actual company objects if you have them (need companies table/hook).
  
  // 3. Companies that downloaded my CV (REQUIRES a doc downloads/analytics table)
  // Here assumed: `useDocumentDownloads(userId)` returning array of { document_id, downloaded_by, ... }
  // Only show items where the document is of type CV and has downloads by a company different from the user.
  // Pseudo code below -- you will need to adapt to your real `document_downloads` implementation!
  // import { useDocumentDownloads } from '@/hooks/useDocumentDownloads'; // You must implement this or get from Supabase directly
  // const { downloads, loading: downloadsLoading } = useDocumentDownloads(userId);
  const downloads = []; // TODO: replace with real useDocumentDownloads(userId)
  
  const myCVs = documents.filter(doc => doc.type === 'cv');
  const cvDownloads = useMemo(() => {
    // This assumes "downloads" have document_id, downloaded_by, etc.
    return downloads
      .filter(d => myCVs.some(cv => cv.id === d.document_id) && d.downloaded_by !== userId)
      .map(d => ({
        ...d,
        doc: myCVs.find(cv => cv.id === d.document_id),
      }));
  }, [downloads, myCVs, userId]);

  // Filtering displayed results
  let mainSection = null;
  if (selectedCategory === 0) {
    // Bookmarked posts
    mainSection = (
      <>
        {bookmarkedPosts.length === 0 ? (
          <ThemedText style={{textAlign:'center'}}>No bookmarked posts yet.</ThemedText>
        ) : (
          bookmarkedPosts.map(post => (
            <PostCard
              key={post.id}
              // Fill out PostCard props as needed for your card
              id={post.id}
              title={post.title ?? post.criteria?.company ?? ''}
              description={post.content ?? ''}
              variant={post.type}
              // ...other props
            />
          ))
        )}
      </>
    );
  } else if (selectedCategory === 1) {
    // Companies I applied to
    mainSection = (
      <>
        {appliedCompanyIds.length === 0 ? (
          <ThemedText style={{textAlign:'center'}}>You have not applied to any companies.</ThemedText>
        ) : (
          appliedCompanyIds.map(companyName => (
            <CompanyCard
              key={companyName}
              name={companyName}
              // Add more company info if available
              // avatarImage='...' 
            />
          ))
        )}
      </>
    );
  } else if (selectedCategory === 2) {
    // Companies that downloaded my CV
    mainSection = (
      <>
        {cvDownloads.length === 0 ? (
          <ThemedText style={{textAlign:'center'}}>No companies have downloaded your CV yet.</ThemedText>
        ) : (
          cvDownloads.map((item, idx) => (
            <ThemedView key={item.doc?.id + idx} style={{marginBottom:12}}>
              <ThemedText>
                {item.downloaded_by} downloaded your CV "{item.doc?.name}" {/* Make prettier */}
              </ThemedText>
              <ThemedText style={{opacity:0.7}}>
                {item.doc?.uploaded_at ? new Date(item.doc.uploaded_at).toLocaleString() : ''}
              </ThemedText>
            </ThemedView>
          ))
        )}
      </>
    );
  }

  const isLoading = postsLoading || bookmarksLoading || applicationsLoading || docsLoading; // || downloadsLoading

  return (
    <ScreenContainer>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Bookmarks & Activity</ThemedText>
          <ThemedText style={styles.subtitle}>See your saved content and job activity</ThemedText>
        </View>
        <View style={styles.categorySection}>
          <ThemedText style={styles.sectionTitle}>Filter</ThemedText>
          <CustomOptionStrip
            visibleOptions={BOOKMARK_CATEGORIES}
            selectedIndex={selectedCategory}
            onChange={setSelectedCategory}
            style={styles.categorySelector}
          />
        </View>
        <View style={styles.contentSection}>
          {isLoading ? (
            <ActivityIndicator size="small" color={textColor} />
          ) : (
            <View>{mainSection}</View>
          )}
        </View>
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 16, opacity: 0.7 },
  categorySection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  categorySelector: { paddingHorizontal: 0 },
  contentSection: { flex: 1 },
});
