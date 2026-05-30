import { View, Text } from "react-native";
import { Card } from "@/components/ui/card";
import { S } from "@/constants/strings";
import type { AttendanceDay } from "@/types";

const statusColors: Record<AttendanceDay["status"], string> = {
  present: "bg-green-500",
  absent: "bg-red-500",
  current: "bg-primary",
  future: "bg-gray-200 dark:bg-gray-700",
};

const statusBorderColors: Record<AttendanceDay["status"], string> = {
  present: "border-green-500",
  absent: "border-red-500",
  current: "border-primary",
  future: "border-gray-200 dark:border-gray-700",
};

interface AttendanceCardProps {
  days: AttendanceDay[];
}

export function AttendanceCard({ days }: AttendanceCardProps) {
  return (
    <Card>
      <Text className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        {S.home.attendance}
      </Text>
      <View className="flex-row justify-between">
        {days.map((day, index) => (
          <View key={index} className="items-center">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {day.day}
            </Text>
            <View
              className={`w-10 h-10 rounded-full items-center justify-center border-2 ${statusBorderColors[day.status]}`}
            >
              <View className={`w-6 h-6 rounded-full ${statusColors[day.status]}`} />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}
