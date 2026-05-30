import { Pressable, Text } from "react-native";

type ButtonVariant = "primary" | "outline" | "ghost";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  outline: "border border-border dark:border-border-dark",
  ghost: "",
};

const variantTextStyles: Record<ButtonVariant, string> = {
  primary: "text-white font-semibold",
  outline: "text-gray-900 dark:text-gray-100 font-medium",
  ghost: "text-gray-700 dark:text-gray-300 font-medium",
};

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  onPress?: () => void;
  className?: string;
}

export function Button({
  children,
  variant = "primary",
  onPress,
  className = "",
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-3 rounded-xl items-center justify-center ${variantStyles[variant]} ${className}`}
    >
      <Text className={`text-sm ${variantTextStyles[variant]}`}>{children}</Text>
    </Pressable>
  );
}
