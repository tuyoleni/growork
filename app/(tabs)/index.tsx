import ContentCard, { ContentCardProps } from '@/components/content/ContentCard';
import Header, { HEADER_HEIGHT } from '@/components/home/Header';
import ScreenContainer from '@/components/ScreenContainer';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Easing, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

// Extended ContentCardProps to include industry
type ExtendedContentCardProps = ContentCardProps & {
  industry?: string;
};

const POSTS: ExtendedContentCardProps[] = [
  {
    variant: 'job',
    title: 'Google',
    avatarImage: 'https://res.cloudinary.com/subframe/image/upload/v1711417543/shared/nbgwxuig538r8ym0f6nu.png',
    mainImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Senior Product Designer - Join our team to design the future. Remote available.',
    isVerified: true,
    onPressApply: () => {},
    industry: 'Technology',
  },
  {
    variant: 'news',
    title: 'Moodbod',
    avatarImage: 'https://res.cloudinary.com/subframe/image/upload/v1751048352/uploads/18239/gxb5iukvs0wxiwmgjike.png',
    mainImage: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Revolutionary AI chip promises 10x performance boost in machine learning.',
    badgeText: 'Tech',
    badgeVariant: 'info',
    industry: 'Technology',
  },
  {
    variant: 'sponsored',
    title: 'Apple',
    avatarImage: 'https://res.cloudinary.com/subframe/image/upload/v1751048352/uploads/18239/gxb5iukvs0wxiwmgjike.png',
    mainImage: 'https://images.unsplash.com/photo-1551651653-c5186a1fbba2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Experience the new MacBook Pro with M3 chip. Unleash your creativity.',
    onPressLearnMore: () => {},
    industry: 'Technology',
  },
  {
    variant: 'job',
    title: 'Amazon',
    avatarImage: 'https://logo.clearbit.com/amazon.com',
    description: 'Frontend Engineer - Work on global e-commerce experiences.',
    isVerified: true,
    onPressApply: () => {},
    industry: 'E-commerce',
  },
  {
    variant: 'news',
    title: 'TechCrunch',
    avatarImage: 'https://logo.clearbit.com/techcrunch.com',
    description: 'Meta releases new AI model that learns from one image.',
    badgeText: 'Tech',
    badgeVariant: 'info',
    industry: 'Technology',
  },
  {
    variant: 'sponsored',
    title: 'Figma',
    avatarImage: 'https://logo.clearbit.com/figma.com',
    description: 'Design together in real-time with Figma Pro. Try it free.',
    onPressLearnMore: () => {},
    industry: 'Design',
  },
  {
    variant: 'job',
    title: 'Netflix',
    avatarImage: 'https://logo.clearbit.com/netflix.com',
    description: "Join Netflix's UI team. Build the future of entertainment UX.",
    isVerified: true,
    mainImage: 'https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?w=800&auto=format&fit=crop&q=60',
    onPressApply: () => {},
    industry: 'Entertainment',
  },
  {
    variant: 'news',
    title: 'Wired',
    avatarImage: 'https://logo.clearbit.com/wired.com',
    description: 'New quantum computing breakthrough changes everything.',
    badgeText: 'Science',
    badgeVariant: 'success',
    industry: 'Technology',
  },
  {
    variant: 'sponsored',
    title: 'Notion',
    avatarImage: 'https://logo.clearbit.com/notion.so',
    description: 'Organize your life and work with Notion AI.',
    onPressLearnMore: () => {},
    industry: 'Software',
  },
  {
    variant: 'job',
    title: 'Spotify',
    avatarImage: 'https://logo.clearbit.com/spotify.com',
    description: 'Looking for Android Developers to join the mobile team.',
    mainImage: 'https://images.unsplash.com/photo-1581276879432-15a57c236857?w=800',
    onPressApply: () => {},
    industry: 'Entertainment',
  },
  {
    variant: 'news',
    title: 'The Verge',
    avatarImage: 'https://logo.clearbit.com/theverge.com',
    description: 'iPhone 16 leaks show game-changing camera design.',
    badgeText: 'Tech',
    badgeVariant: 'info',
    industry: 'Technology',
  },
  {
    variant: 'sponsored',
    title: 'Canva',
    avatarImage: 'https://logo.clearbit.com/canva.com',
    description: 'Design with ease using Canva Pro. First month free.',
    onPressLearnMore: () => {},
    industry: 'Design',
  },
  {
    variant: 'job',
    title: 'Stripe',
    avatarImage: 'https://logo.clearbit.com/stripe.com',
    description: 'Hiring backend engineers to improve global payments.',
    isVerified: true,
    onPressApply: () => {},
    industry: 'Fintech',
  },
  {
    variant: 'news',
    title: 'Mashable',
    avatarImage: 'https://logo.clearbit.com/mashable.com',
    description: '5 apps that are transforming productivity forever.',
    badgeText: 'Tech',
    badgeVariant: 'info',
    industry: 'Technology',
  },
  {
    variant: 'sponsored',
    title: 'Slack',
    avatarImage: 'https://logo.clearbit.com/slack.com',
    description: 'Work better, together. Slack for Teams is now free.',
    onPressLearnMore: () => {},
    industry: 'Software',
  },
  {
    variant: 'job',
    title: 'Dropbox',
    avatarImage: 'https://logo.clearbit.com/dropbox.com',
    description: "Join Dropbox's mobile experience team. Hiring React Native devs.",
    isVerified: false,
    mainImage: 'https://images.unsplash.com/photo-1534126511673-b6899657816a?w=800',
    onPressApply: () => {},
    industry: 'Software',
  },
  {
    variant: 'news',
    title: 'Engadget',
    avatarImage: 'https://logo.clearbit.com/engadget.com',
    description: 'Electric vehicle sales break new global record.',
    badgeText: 'Finance',
    badgeVariant: 'error',
    industry: 'Automotive',
  },
  {
    variant: 'sponsored',
    title: 'Adobe',
    avatarImage: 'https://logo.clearbit.com/adobe.com',
    description: 'Adobe Firefly: Your AI design assistant.',
    onPressLearnMore: () => {},
    industry: 'Design',
  },
  {
    variant: 'job',
    title: 'Tesla',
    avatarImage: 'https://logo.clearbit.com/tesla.com',
    description: 'AI & Autopilot team is hiring ML engineers.',
    onPressApply: () => {},
    industry: 'Automotive',
  },
  {
    variant: 'news',
    title: 'Bloomberg',
    avatarImage: 'https://logo.clearbit.com/bloomberg.com',
    description: 'Global stocks react to interest rate shift.',
    badgeText: 'Finance',
    badgeVariant: 'error',
    industry: 'Finance',
  },
];

export default function Home() {
  const headerHeight = HEADER_HEIGHT;
  const [headerVisible, setHeaderVisible] = useState(true);
  const headerAnim = useRef(new Animated.Value(0)).current; // 0: visible, -HEADER_HEIGHT: hidden
  const lastScrollY = useRef(0);
  const isAnimating = useRef(false);

  // Filter states
  const [selectedContentType, setSelectedContentType] = useState(0); // 0: All, 1: Jobs, 2: News
  const [selectedIndustry, setSelectedIndustry] = useState(-1); // -1: All industries

  // Helper function to get industry label from index
  const getIndustryLabel = (index: number) => {
    const industries = ['Technology', 'Finance', 'Healthcare', 'Retail', 'Logistics', 'Education', 'Design', 'Software', 'Entertainment', 'E-commerce', 'Fintech', 'Automotive'];
    return industries[index] || '';
  };

  // Filter posts based on selected filters using useMemo for stability
  const filteredPosts = useMemo(() => {
    return POSTS.filter(post => {
      // Sponsored content is always visible
      if (post.variant === 'sponsored') return true;
      
      // Content type filter for jobs and news
      if (selectedContentType === 1 && post.variant !== 'job') return false;
      if (selectedContentType === 2 && post.variant !== 'news') return false;
      
      // Industry filter (if an industry is selected) - only applies to jobs and news
      if (selectedIndustry !== -1) {
        const selectedIndustryLabel = getIndustryLabel(selectedIndustry);
        if (post.industry !== selectedIndustryLabel) return false;
      }
      
      return true;
    });
  }, [selectedContentType, selectedIndustry]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const diff = y - lastScrollY.current;
    if (y < 40) {
      lastScrollY.current = y;
      return;
    }
    if (diff > 10 && !isAnimating.current && headerVisible) {
      // Scrolling down, hide header immediately
      isAnimating.current = true;
      Animated.timing(headerAnim, {
        toValue: -HEADER_HEIGHT,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setHeaderVisible(false);
        isAnimating.current = false;
      });
    } else if (diff < -10 && !isAnimating.current && !headerVisible) {
      // Scrolling up, show header after a delay
      isAnimating.current = true;
      setTimeout(() => {
        Animated.timing(headerAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          setHeaderVisible(true);
          isAnimating.current = false;
        });
      }, 300); // 300ms delay before revealing
    }
    lastScrollY.current = y;
  };

  return (
    <ScreenContainer>
      <Animated.View style={{
        transform: [{ translateY: headerAnim }],
        zIndex: 10,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
      }}>
        <Header 
          selectedContentType={selectedContentType}
          onContentTypeChange={setSelectedContentType}
          selectedIndustry={selectedIndustry}
          onIndustryChange={setSelectedIndustry}
        />
      </Animated.View>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={{ paddingTop: 0 }}
      >
        {filteredPosts.map((post, index) => (
          <ContentCard
            key={`${post.title}-${post.variant}-${index}`}
            {...post}
            style={index === 0 ? { marginTop: HEADER_HEIGHT - 48 } : undefined}
          />
        ))}
      </Animated.ScrollView>
    </ScreenContainer>
  );
}
