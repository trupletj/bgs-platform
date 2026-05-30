import { View, Text } from "react-native";
import { Cake } from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { S } from "@/constants/strings";

export function BirthdayCard() {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
      <View className="flex-row items-center gap-3">
        <View className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 items-center justify-center">
          <Cake size={24} color="#F59E0B" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-900 dark:text-white">
            {S.home.birthday}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {S.home.birthdayMessage}
          </Text>
        </View>
      </View>
    </Card>
  );
}
