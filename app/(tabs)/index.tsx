import ContentCard, { ContentCardProps } from '@/components/content/ContentCard';
import Header, { HEADER_HEIGHT } from '@/components/home/Header';
import ScreenContainer from '@/components/ScreenContainer';
import React, { useRef, useState } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const POSTS: ContentCardProps[] = [
  {
    variant: 'job',
    title: 'Google',
    avatarImage: 'https://res.cloudinary.com/subframe/image/upload/v1711417543/shared/nbgwxuig538r8ym0f6nu.png',
    mainImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Senior Product Designer - Join our team to design the future. Remote available.',
    isVerified: true,
    onPressApply: () => {},
  },
  {
    variant: 'news',
    title: 'Moodbod',
    avatarImage: 'https://res.cloudinary.com/subframe/image/upload/v1751048352/uploads/18239/gxb5iukvs0wxiwmgjike.png',
    mainImage: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Revolutionary AI chip promises 10x performance boost in machine learning.',
    badgeText: 'Tech',
    badgeVariant: 'info',
  },
  {
    variant: 'sponsored',
    title: 'Apple',
    avatarImage: 'https://res.cloudinary.com/subframe/image/upload/v1751048352/uploads/18239/gxb5iukvs0wxiwmgjike.png',
    mainImage: 'https://images.unsplash.com/photo-1551651653-c5186a1fbba2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Experience the new MacBook Pro with M3 chip. Unleash your creativity.',
    onPressLearnMore: () => {},
  },
  {
    variant: 'job',
    title: 'Amazon',
    avatarImage: 'https://logo.clearbit.com/amazon.com',
    description: 'Frontend Engineer - Work on global e-commerce experiences.',
    isVerified: true,
    onPressApply: () => {},
  },
  {
    variant: 'news',
    title: 'TechCrunch',
    avatarImage: 'https://logo.clearbit.com/techcrunch.com',
    description: 'Meta releases new AI model that learns from one image.',
    badgeText: 'Tech',
    badgeVariant: 'info',
  },
  {
    variant: 'sponsored',
    title: 'Figma',
    avatarImage: 'https://logo.clearbit.com/figma.com',
    description: 'Design together in real-time with Figma Pro. Try it free.',
    onPressLearnMore: () => {},
  },
  {
    variant: 'job',
    title: 'Netflix',
    avatarImage: 'https://logo.clearbit.com/netflix.com',
    description: "Join Netflix's UI team. Build the future of entertainment UX.",
    isVerified: true,
    mainImage: 'https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?w=800&auto=format&fit=crop&q=60',
    onPressApply: () => {},
  },
  {
    variant: 'news',
    title: 'Wired',
    avatarImage: 'https://logo.clearbit.com/wired.com',
    description: 'New quantum computing breakthrough changes everything.',
    badgeText: 'Science',
    badgeVariant: 'success',
  },
  {
    variant: 'sponsored',
    title: 'Notion',
    avatarImage: 'https://logo.clearbit.com/notion.so',
    description: 'Organize your life and work with Notion AI.',
    onPressLearnMore: () => {},
  },
  {
    variant: 'job',
    title: 'Spotify',
    avatarImage: 'https://logo.clearbit.com/spotify.com',
    description: 'Looking for Android Developers to join the mobile team.',
    mainImage: 'https://images.unsplash.com/photo-1581276879432-15a57c236857?w=800',
    onPressApply: () => {},
  },
  {
    variant: 'news',
    title: 'The Verge',
    avatarImage: 'https://logo.clearbit.com/theverge.com',
    description: 'iPhone 16 leaks show game-changing camera design.',
    badgeText: 'Tech',
    badgeVariant: 'info',
  },
  {
    variant: 'sponsored',
    title: 'Canva',
    avatarImage: 'https://logo.clearbit.com/canva.com',
    description: 'Design with ease using Canva Pro. First month free.',
    onPressLearnMore: () => {},
  },
  {
    variant: 'job',
    title: 'Stripe',
    avatarImage: 'https://logo.clearbit.com/stripe.com',
    description: 'Hiring backend engineers to improve global payments.',
    isVerified: true,
    onPressApply: () => {},
  },
  {
    variant: 'news',
    title: 'Mashable',
    avatarImage: 'https://logo.clearbit.com/mashable.com',
    description: '5 apps that are transforming productivity forever.',
    badgeText: 'Tech',
    badgeVariant: 'info',
  },
  {
    variant: 'sponsored',
    title: 'Slack',
    avatarImage: 'https://logo.clearbit.com/slack.com',
    description: 'Work better, together. Slack for Teams is now free.',
    onPressLearnMore: () => {},
  },
  {
    variant: 'job',
    title: 'Dropbox',
    avatarImage: 'https://logo.clearbit.com/dropbox.com',
    description: "Join Dropbox's mobile experience team. Hiring React Native devs.",
    isVerified: false,
    mainImage: 'https://images.unsplash.com/photo-1534126511673-b6899657816a?w=800',
    onPressApply: () => {},
  },
  {
    variant: 'news',
    title: 'Engadget',
    avatarImage: 'https://logo.clearbit.com/engadget.com',
    description: 'Electric vehicle sales break new global record.',
    badgeText: 'Finance',
    badgeVariant: 'error',
  },
  {
    variant: 'sponsored',
    title: 'Adobe',
    avatarImage: 'https://logo.clearbit.com/adobe.com',
    description: 'Adobe Firefly: Your AI design assistant.',
    onPressLearnMore: () => {},
  },
  {
    variant: 'job',
    title: 'Tesla',
    avatarImage: 'https://logo.clearbit.com/tesla.com',
    description: 'AI & Autopilot team is hiring ML engineers.',
    onPressApply: () => {},
  },
  {
    variant: 'news',
    title: 'Bloomberg',
    avatarImage: 'https://logo.clearbit.com/bloomberg.com',
    description: 'Global stocks react to interest rate shift.',
    badgeText: 'Finance',
    badgeVariant: 'error',
  },
];

export default function Home() {
  const headerHeight = HEADER_HEIGHT;
  const [headerVisible, setHeaderVisible] = useState(true);
  const headerAnim = useRef(new Animated.Value(0)).current; // 0: visible, -HEADER_HEIGHT: hidden
  const lastScrollY = useRef(0);
  const isAnimating = useRef(false);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const diff = y - lastScrollY.current;
    if (diff > 10 && !isAnimating.current && headerVisible) {
      // Scrolling down, hide header immediately
      isAnimating.current = true;
      Animated.timing(headerAnim, {
        toValue: -HEADER_HEIGHT,
        duration: 200,
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
          duration: 200,
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
        <Header />
      </Animated.View>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}
      >
        {POSTS.map((post, index) => (
          <ContentCard key={index} {...post} />
        ))}
      </Animated.ScrollView>
    </ScreenContainer>
  );
}
