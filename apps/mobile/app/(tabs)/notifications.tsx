import { ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import { NotificationList } from "@/components/notifications/notification-list";
import { NewsList } from "@/components/notifications/news-list";
import { S } from "@/constants/strings";
import { useAppStore } from "@/stores/app-store";

export default function NotificationsScreen() {
  const { notificationsTab, setNotificationsTab } = useAppStore();

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Text className="text-xl font-bold text-gray-900 dark:text-white">
          {S.notifications.title}
        </Text>
        {notificationsTab === 0 && (
          <Pressable>
            <Text className="text-sm text-primary font-medium">
              {S.notifications.markAllRead}
            </Text>
          </Pressable>
        )}
      </View>

      <View className="px-4 pb-2">
        <SegmentTabs
          tabs={[S.notifications.notifications, S.notifications.news]}
          activeIndex={notificationsTab}
          onChange={setNotificationsTab}
        />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-4">
        {notificationsTab === 0 ? <NotificationList /> : <NewsList />}
      </ScrollView>
    </SafeAreaView>
  );
}
