import { View, Text } from "react-native";

type BadgeVariant = "default" | "success" | "danger" | "warning" | "info";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 dark:bg-gray-800",
  success: "bg-green-100 dark:bg-green-900",
  danger: "bg-red-100 dark:bg-red-900",
  warning: "bg-yellow-100 dark:bg-yellow-900",
  info: "bg-blue-100 dark:bg-blue-900",
};

const variantTextStyles: Record<BadgeVariant, string> = {
  default: "text-gray-700 dark:text-gray-300",
  success: "text-green-700 dark:text-green-300",
  danger: "text-red-700 dark:text-red-300",
  warning: "text-yellow-700 dark:text-yellow-300",
  info: "text-blue-700 dark:text-blue-300",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <View className={`px-2.5 py-1 rounded-full ${variantStyles[variant]} ${className}`}>
      <Text className={`text-xs font-medium ${variantTextStyles[variant]}`}>
        {children}
      </Text>
    </View>
  );
}
