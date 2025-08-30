import React from "react";
import { View, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ThemedAvatar } from "@/components/ui/ThemedAvatar";
import ThemedButton from "@/components/ui/ThemedButton";
import { useThemeColor } from "@/hooks/ui/useThemeColor";
import { Company } from "@/types/company";
import { Feather } from "@expo/vector-icons";

interface CompanyHeaderProps {
  company: Company;
  isFollowing: boolean;
  onFollowToggle: () => void;
  loading?: boolean;
  postsCount?: number;
  jobsCount?: number;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({
  company,
  isFollowing,
  onFollowToggle,
  loading = false,
  postsCount = 0,
  jobsCount = 0,
}) => {
  const mutedTextColor = useThemeColor({}, "mutedText");
  const borderColor = useThemeColor({}, "border");
  const tintColor = useThemeColor({}, "tint");

  const handleWebsitePress = () => {
    if (company.website) {
      Linking.openURL(company.website);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Company Basic Info with Stats Inline */}
      <View style={styles.basicInfo}>
        <ThemedAvatar
          size={70}
          image={
            company.logo_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              company.name
            )}&size=70&background=random`
          }
          square={true}
        />
        <View style={styles.info}>
          <ThemedText style={styles.name}>{company.name}</ThemedText>
          {company.industry && (
            <ThemedText style={[styles.subtitle, { color: mutedTextColor }]}>
              {company.industry}
            </ThemedText>
          )}
          {company.location && (
            <View style={styles.locationContainer}>
              <Feather name="map-pin" size={12} color={mutedTextColor} />
              <ThemedText style={[styles.location, { color: mutedTextColor }]}>
                {company.location}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Stats Inline */}
        <View style={styles.statsInline}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{postsCount}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>
              Posts
            </ThemedText>
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: borderColor }]}
          />
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{jobsCount}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>
              Jobs
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Follow Button */}
      <ThemedView
        style={[styles.followSection, { borderBottomColor: borderColor }]}
      >
        <ThemedButton
          title={isFollowing ? "Following" : "Follow Company"}
          onPress={onFollowToggle}
          variant={isFollowing ? "primary" : "outline"}
          size="medium"
          style={styles.followButton}
          disabled={loading}
        />
      </ThemedView>

      {/* Company Description */}
      {company.description && (
        <ThemedView
          style={[
            styles.descriptionSection,
            { borderBottomColor: borderColor },
          ]}
        >
          <ThemedText style={styles.description}>
            {company.description}
          </ThemedText>
        </ThemedView>
      )}

      {/* Contact Information */}
      {company.website && (
        <ThemedView style={styles.contactSection}>
          <TouchableOpacity
            style={styles.websiteButton}
            onPress={handleWebsitePress}
          >
            <Feather name="globe" size={16} color={tintColor} />
            <ThemedText style={[styles.websiteText, { color: tintColor }]}>
              Visit Website
            </ThemedText>
            <Feather name="external-link" size={14} color={tintColor} />
          </TouchableOpacity>
        </ThemedView>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  basicInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  location: {
    fontSize: 12,
  },
  statsInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 8,
  },
  statItem: {
    alignItems: "center",
    minWidth: 40,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  followSection: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  followButton: {
    width: "100%",
  },
  descriptionSection: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  contactSection: {
    paddingVertical: 16,
  },
  websiteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  websiteText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
});
