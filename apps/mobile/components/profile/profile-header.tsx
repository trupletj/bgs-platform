import { View, Text } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import type { User } from "@/types";

interface ProfileHeaderProps {
  user: User;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <View className="items-center py-6">
      <Avatar name={user.name} imageUrl={user.avatarUrl} size="lg" />
      <Text className="text-lg font-bold text-gray-900 dark:text-white mt-3">
        {user.name}
      </Text>
      <View
        className={`flex-row items-center mt-1.5 px-2.5 py-1 rounded-full ${
          user.isWorking
            ? "bg-green-100 dark:bg-green-900"
            : "bg-yellow-100 dark:bg-yellow-900"
        }`}
      >
        <View
          className={`w-2 h-2 rounded-full mr-1.5 ${
            user.isWorking ? "bg-green-500" : "bg-yellow-500"
          }`}
        />
        <Text
          className={`text-xs font-medium ${
            user.isWorking
              ? "text-green-700 dark:text-green-300"
              : "text-yellow-700 dark:text-yellow-300"
          }`}
        >
          {user.isWorking ? "Ажиллаж байна" : "Амарч байна"}
        </Text>
      </View>
      <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {user.role}
      </Text>
      <Text className="text-xs text-gray-400 mt-0.5">{user.department}</Text>
    </View>
  );
}
