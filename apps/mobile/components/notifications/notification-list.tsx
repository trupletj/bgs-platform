import { View, Text, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Info, AlertTriangle, CheckCircle } from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { S } from "@/constants/strings";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Notification } from "@/types";

const typeIcons: Record<
  Notification["type"],
  { icon: React.ComponentType<{ size: number; color: string }>; color: string; bg: string }
> = {
  info: { icon: Info, color: "#2563EB", bg: "bg-blue-50 dark:bg-blue-950" },
  warning: { icon: AlertTriangle, color: "#F59E0B", bg: "bg-yellow-50 dark:bg-yellow-950" },
  success: { icon: CheckCircle, color: "#22C55E", bg: "bg-green-50 dark:bg-green-950" },
};

function groupByDate(notifications: Notification[]) {
  const today = "2026-02-16";
  const yesterday = "2026-02-15";

  const groups: { title: string; items: Notification[] }[] = [
    { title: S.notifications.today, items: [] },
    { title: S.notifications.yesterday, items: [] },
    { title: S.notifications.earlier, items: [] },
  ];

  for (const n of notifications) {
    if (n.date === today) groups[0].items.push(n);
    else if (n.date === yesterday) groups[1].items.push(n);
    else groups[2].items.push(n);
  }

  return groups.filter((g) => g.items.length > 0);
}

export function NotificationList() {
  const { data: notifications } = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: api.getNotifications,
  });

  const groups = notifications ? groupByDate(notifications) : [];

  return (
    <View>
      {groups.map((group) => (
        <View key={group.title} className="mt-4">
          <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
            {group.title}
          </Text>
          <Card className="p-0 overflow-hidden">
            {group.items.map((item, index) => {
              const { icon: Icon, color, bg } = typeIcons[item.type];
              return (
                <Pressable
                  key={item.id}
                  className={`flex-row items-start p-4 ${
                    index < group.items.length - 1
                      ? "border-b border-gray-50 dark:border-gray-800"
                      : ""
                  } ${!item.read ? "bg-blue-50/50 dark:bg-blue-950/30" : ""}`}
                >
                  <View
                    className={`w-10 h-10 rounded-full ${bg} items-center justify-center mr-3 mt-0.5`}
                  >
                    <Icon size={18} color={color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </Text>
                      {!item.read && (
                        <View className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </View>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {item.message}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </Card>
        </View>
      ))}
    </View>
  );
}
