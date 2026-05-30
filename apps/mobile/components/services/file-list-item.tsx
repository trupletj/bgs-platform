import { View, Text, Pressable } from "react-native";
import { FileText, FileSpreadsheet, FileImage, File, ChevronRight } from "lucide-react-native";
import type { FileItem } from "@/types";

const typeIcons: Record<FileItem["type"], { icon: React.ComponentType<{ size: number; color: string }>; color: string; bg: string }> = {
  pdf: { icon: FileText, color: "#EF4444", bg: "bg-red-50 dark:bg-red-950" },
  doc: { icon: FileText, color: "#2563EB", bg: "bg-blue-50 dark:bg-blue-950" },
  xls: { icon: FileSpreadsheet, color: "#22C55E", bg: "bg-green-50 dark:bg-green-950" },
  img: { icon: FileImage, color: "#8B5CF6", bg: "bg-purple-50 dark:bg-purple-950" },
  other: { icon: File, color: "#6B7280", bg: "bg-gray-50 dark:bg-gray-800" },
};

interface FileListItemProps {
  item: FileItem;
}

export function FileListItem({ item }: FileListItemProps) {
  const { icon: Icon, color, bg } = typeIcons[item.type];

  return (
    <Pressable className="flex-row items-center py-3 border-b border-gray-50 dark:border-gray-800">
      <View className={`w-10 h-10 rounded-xl ${bg} items-center justify-center mr-3`}>
        <Icon size={20} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-900 dark:text-white" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs text-gray-400 mt-0.5">
          {item.size} · {item.date}
        </Text>
      </View>
      <ChevronRight size={16} color="#9CA3AF" />
    </Pressable>
  );
}
