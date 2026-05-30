import { View, Text } from "react-native";
import { FileText, Bell, ChevronRight } from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import { S } from "@/constants/strings";
import { useAppStore } from "@/stores/app-store";
import type { FileItem, Notification } from "@/types";

interface TodayHighlightsProps {
  files: FileItem[];
  notifications: Notification[];
}

export function TodayHighlights({ files, notifications }: TodayHighlightsProps) {
  const { homeTab, setHomeTab } = useAppStore();

  return (
    <Card>
      <Text className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        {S.home.today}
      </Text>
      <SegmentTabs
        tabs={[S.home.files, S.home.notifications]}
        activeIndex={homeTab}
        onChange={setHomeTab}
        className="mb-3"
      />

      {homeTab === 0 ? (
        <View className="gap-2">
          {files.slice(0, 3).map((file) => (
            <View
              key={file.id}
              className="flex-row items-center py-2 border-b border-gray-50 dark:border-gray-800"
            >
              <View className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950 items-center justify-center mr-3">
                <FileText size={16} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-900 dark:text-white" numberOfLines={1}>
                  {file.name}
                </Text>
                <Text className="text-xs text-gray-400">{file.size}</Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </View>
          ))}
        </View>
      ) : (
        <View className="gap-2">
          {notifications.slice(0, 3).map((notif) => (
            <View
              key={notif.id}
              className="flex-row items-center py-2 border-b border-gray-50 dark:border-gray-800"
            >
              <View className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 items-center justify-center mr-3">
                <Bell size={16} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-900 dark:text-white" numberOfLines={1}>
                  {notif.title}
                </Text>
                <Text className="text-xs text-gray-400" numberOfLines={1}>
                  {notif.message}
                </Text>
              </View>
              {!notif.read && (
                <View className="w-2 h-2 rounded-full bg-primary" />
              )}
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
