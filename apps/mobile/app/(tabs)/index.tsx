import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react-native";
import { AttendanceCard } from "@/components/home/attendance-card";
import { TimeDisplay } from "@/components/home/time-display";
import { BirthdayCard } from "@/components/home/birthday-card";
import { ServiceGrid } from "@/components/home/service-grid";
import { TodayHighlights } from "@/components/home/today-highlights";
import { Avatar } from "@/components/ui/avatar";
import { S } from "@/constants/strings";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);

  const workerId = user?.employeeId;

  const { data: attendance } = useQuery({
    queryKey: queryKeys.attendance.week(workerId ?? ""),
    queryFn: () => api.getAttendance(workerId!),
    enabled: !!workerId,
  });

  const { data: services } = useQuery({
    queryKey: queryKeys.services.all,
    queryFn: api.getServices,
  });

  const { data: files } = useQuery({
    queryKey: queryKeys.files.all,
    queryFn: api.getFiles,
  });

  const { data: notifications } = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: api.getNotifications,
  });

  const todayAttendance = attendance?.days.find((d) => d.status === "current");

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-4">
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-row items-center gap-3">
            <Avatar name={user?.name ?? "U"} imageUrl={user?.avatarUrl} size="sm" />
            <View>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {S.home.greeting}
              </Text>
              <Text className="text-base font-bold text-gray-900 dark:text-white">
                {user?.name ?? ""}
              </Text>
            </View>
          </View>
          <View className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center">
            <Bell size={20} color="#6B7280" />
          </View>
        </View>

        {/* Attendance */}
        {attendance && (
          <View className="gap-3">
            <AttendanceCard days={attendance.days} />
            <TimeDisplay
              checkIn={todayAttendance?.checkIn}
              checkOut={todayAttendance?.checkOut}
              totalHours={attendance.totalHours}
            />
          </View>
        )}

        {/* Birthday */}
        <View className="mt-3">
          <BirthdayCard />
        </View>

        {/* Services Grid */}
        {services && (
          <View className="mt-3">
            <ServiceGrid services={services} />
          </View>
        )}

        {/* Today Highlights */}
        {files && notifications && (
          <View className="mt-3">
            <TodayHighlights files={files} notifications={notifications} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
