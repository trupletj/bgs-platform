import { View } from "react-native";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <View className={`bg-white dark:bg-card-dark rounded-2xl p-4 shadow-sm ${className}`}>
      {children}
    </View>
  );
}
