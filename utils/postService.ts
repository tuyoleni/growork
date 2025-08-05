import { supabase } from './superbase';
import { Post, RecommendedPost } from '@/types/post';

/**
 * Fetch a post by ID
 * @param id Post ID
 * @returns Post data
 */
export const fetchPostById = async (id: string): Promise<Post> => {
  try {
    // In a real implementation, fetch from Supabase
    // const { data, error } = await supabase
    //   .from('posts')
    //   .select(`
    //     *,
    //     company:companies(id, name, logo, verified)
    //   `)
    //   .eq('id', id)
    //   .single();
    
    // if (error) throw error;
    // return data;

    // Mock data for demonstration
    return {
      id,
      title: 'Senior Product Designer',
      company: {
        id: 'company-1',
        name: 'Google',
        logo: 'https://res.cloudinary.com/subframe/image/upload/v1711417543/shared/nbgwxuig538r8ym0f6nu.png',
        verified: true,
      },
      location: 'San Francisco, CA',
      type: 'Full-time',
      remote: true,
      description: 'Join our team in creating the next generation of design tools. We\'re looking for a Senior Product Designer to help shape the future of our design platform.',
      requirements: [
        '5+ years of product design experience',
        'Strong portfolio of shipped products',
        'Experience with design systems',
        'Excellence in user research and testing',
      ],
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      isHiring: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
};

/**
 * Fetch recommended posts based on the current post
 * @param postId Current post ID
 * @returns Array of recommended posts
 */
export const fetchRecommendedPosts = async (postId: string): Promise<RecommendedPost[]> => {
  try {
    // In a real implementation, fetch from Supabase
    // const { data, error } = await supabase
    //   .from('posts')
    //   .select(`
    //     id,
    //     title,
    //     company:companies(name, logo),
    //     location,
    //     remote
    //   `)
    //   .neq('id', postId)
    //   .limit(3);
    
    // if (error) throw error;
    // return data;

    // Mock data for demonstration
    return [
      {
        id: '1',
        title: 'Product Designer',
        company: {
          name: 'Microsoft',
          logo: 'https://images.unsplash.com/photo-1496200186974-4293800e2c20?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        },
        location: 'Remote',
        remote: true,
      },
      {
        id: '2',
        title: 'Senior UX Designer',
        company: {
          name: 'Apple',
          logo: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        },
        location: 'Cupertino',
        remote: false,
      },
      {
        id: '3',
        title: 'Product Design Lead',
        company: {
          name: 'Meta',
          logo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        },
        location: 'Hybrid',
        remote: true,
      },
    ];
  } catch (error) {
    console.error('Error fetching recommended posts:', error);
    throw error;
  }
};

/**
 * Toggle like status for a post
 * @param postId Post ID
 * @param liked Current like status
 * @returns Updated like status
 */
export const toggleLikePost = async (postId: string, liked: boolean): Promise<boolean> => {
  try {
    // In a real implementation, update in Supabase
    // const { data, error } = await supabase
    //   .from('post_likes')
    //   .upsert({
    //     post_id: postId,
    //     user_id: 'current-user-id', // Get from auth context
    //     liked: !liked,
    //   });
    
    // if (error) throw error;
    return !liked;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

/**
 * Toggle bookmark status for a post
 * @param postId Post ID
 * @param bookmarked Current bookmark status
 * @returns Updated bookmark status
 */
export const toggleBookmarkPost = async (postId: string, bookmarked: boolean): Promise<boolean> => {
  try {
    // In a real implementation, update in Supabase
    // const { data, error } = await supabase
    //   .from('bookmarks')
    //   .upsert({
    //     post_id: postId,
    //     user_id: 'current-user-id', // Get from auth context
    //     bookmarked: !bookmarked,
    //   });
    
    // if (error) throw error;
    return !bookmarked;
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    throw error;
  }
};