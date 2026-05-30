import { View, Text } from "react-native";
import { Clock, LogIn, LogOut } from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { S } from "@/constants/strings";

interface TimeDisplayProps {
  checkIn?: string;
  checkOut?: string;
  totalHours: string;
}

export function TimeDisplay({ checkIn, checkOut, totalHours }: TimeDisplayProps) {
  return (
    <Card>
      <View className="flex-row justify-between">
        <View className="flex-row items-center gap-2">
          <LogIn size={16} color="#22C55E" />
          <View>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {S.home.checkIn}
            </Text>
            <Text className="text-sm font-semibold text-gray-900 dark:text-white">
              {checkIn || "--:--"}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <LogOut size={16} color="#EF4444" />
          <View>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {S.home.checkOut}
            </Text>
            <Text className="text-sm font-semibold text-gray-900 dark:text-white">
              {checkOut || "--:--"}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Clock size={16} color="#2563EB" />
          <View>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {S.home.weeklyHours}
            </Text>
            <Text className="text-sm font-semibold text-gray-900 dark:text-white">
              {totalHours}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}
