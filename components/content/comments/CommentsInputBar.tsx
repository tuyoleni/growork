import React, { RefObject, Dispatch, SetStateAction } from "react";
import { View, ActivityIndicator, StyleSheet, Keyboard } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedInput } from "../../ThemedInput";
import { useThemeColor } from "@/hooks";
import type { Profile } from "@/types";
import { ThemedAvatar } from "@/components/ui/ThemedAvatar";
import { ThemedIconButton } from "@/components/ui/ThemedIconButton";

interface CommentsInputBarProps {
  profile: Profile | null;
  value: string;
  onChange: Dispatch<SetStateAction<string>> | ((text: string) => void);
  onSend: () => void | Promise<void>;
  isSending: boolean;
  inputRef: RefObject<any>;
  onEmojiPicker: () => void;
}

export function CommentsInputBar({
  profile,
  value,
  onChange,
  onSend,
  isSending,
  inputRef,
  onEmojiPicker,
}: CommentsInputBarProps) {
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "border");
  const mutedTextColor = useThemeColor({}, "mutedText");

  const handleSend = async () => {
    if (value.trim()) {
      await onSend();
      Keyboard.dismiss();
    }
  };

  return (
    <View style={[styles.inputWrap, { borderColor }]}>
      {profile && (
        <ThemedAvatar
          image={
            profile.avatar_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || "User")}&size=128`
          }
          size={32}
        />
      )}
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
        <ThemedInput
          placeholder="Add a comment..."
          value={value}
          onChangeText={onChange}
          multiline
          style={{ flex: 1 }}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <ThemedIconButton
          icon={<Feather name="smile" size={20} color={mutedTextColor} />}
          onPress={onEmojiPicker}
        />
        <ThemedIconButton
          icon={
            isSending ? (
              <ActivityIndicator size={20} color={tintColor} />
            ) : (
              <Feather name="send" size={20} color={tintColor} />
            )
          }
          onPress={handleSend}
          disabled={isSending || !value.trim()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
