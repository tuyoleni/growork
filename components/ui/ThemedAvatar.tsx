import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";

interface ThemedAvatarProps {
  image: string;
  size?: number;
  square?: boolean;
  children?: React.ReactNode;
}

export const ThemedAvatar: React.FC<ThemedAvatarProps> = ({
  image,
  size = 42,
  square = false,
  children,
}) => (
  <View style={{ position: "relative" }}>
    <Image
      source={{ uri: image }}
      style={{
        width: size,
        height: size,
        borderRadius: square ? 4 : size / 2,
      }}
    />
    {children}
  </View>
);
