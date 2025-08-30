import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  useColorScheme,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Company } from "../../types/company";
import ScreenContainer from "../../components/ScreenContainer";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
import ThemedButton from "../../components/ui/ThemedButton";
import { CompanyHeader, CompanyPosts } from "../../components/company";
import { useCompanies } from "../../hooks/companies";
import { useCompanyFollows } from "../../hooks/companies/useCompanyFollows";
import { useAuth } from "../../hooks/auth";
import { useThemeColor } from "../../hooks";
import { useCompanyPosts } from "../../hooks/posts";

export default function CompanyDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { profile } = useAuth();
  const { getCompanyByIdPublic } = useCompanies();
  const { followCompany, unfollowCompany, isFollowingCompany } =
    useCompanyFollows();
  const { posts } = useCompanyPosts(id || "");

  // Theme colors
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "border");
  const mutedTextColor = useThemeColor({}, "mutedText");
  const tintColor = useThemeColor({}, "tint");

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Calculate counts from the actual posts data
  const postsCount = posts?.length || 0;
  const jobsCount = posts?.filter((post) => post.type === "job").length || 0;

  // Load company details
  useEffect(() => {
    const loadCompany = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { company: companyResult, error } = await getCompanyByIdPublic(
          id
        );

        if (error) {
          console.error("Error loading company:", error);
          return;
        }

        if (companyResult) {
          setCompany(companyResult);
          // Check if user is following this company
          const followingStatus = await isFollowingCompany(id);
          setIsFollowing(followingStatus);
        }
      } catch (error) {
        console.error("Error loading company:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [id, getCompanyByIdPublic, isFollowingCompany]);

  const handleFollowToggle = async () => {
    if (!id || followLoading) return;

    try {
      setFollowLoading(true);

      if (isFollowing) {
        const result = await unfollowCompany(id);
        if (!result.error) {
          setIsFollowing(false);
        }
      } else {
        const result = await followCompany(id);
        if (!result.error) {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      console.error("Error toggling follow status:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!company) {
    return (
      <ScreenContainer>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        />
        <View style={styles.loadingContainer}>
          <Feather
            name="home"
            size={48}
            color={mutedTextColor}
            style={{ marginBottom: 16 }}
          />
          <ThemedText style={[styles.loadingText, { color: mutedTextColor }]}>
            Company not found
          </ThemedText>
          <ThemedButton
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
            style={{ marginTop: 16 }}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Company</ThemedText>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              /* Share company */
            }}
          >
            <Feather name="share" size={20} color={textColor} />
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Header with integrated stats */}
        <CompanyHeader
          company={company}
          isFollowing={isFollowing}
          onFollowToggle={handleFollowToggle}
          loading={followLoading}
          postsCount={postsCount}
          jobsCount={jobsCount}
        />

        {/* Company Posts */}
        <CompanyPosts companyId={id} posts={company?.posts} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 10,
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
  },
});
