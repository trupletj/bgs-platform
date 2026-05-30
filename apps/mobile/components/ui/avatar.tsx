import { View, Text, Image } from "react-native";

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24",
};

const textSizes = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-3xl",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Avatar({ name, imageUrl, size = "md", className = "" }: AvatarProps) {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        className={`${sizeStyles[size]} rounded-full ${className}`}
      />
    );
  }

  return (
    <View
      className={`${sizeStyles[size]} rounded-full bg-primary items-center justify-center ${className}`}
    >
      <Text className={`${textSizes[size]} font-bold text-white`}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
