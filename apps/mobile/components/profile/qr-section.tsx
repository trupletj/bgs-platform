import { View, Text } from "react-native";
import { QrCode } from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import { S } from "@/constants/strings";
import { useAppStore } from "@/stores/app-store";

interface QRSectionProps {
  name: string;
  employeeId: string;
}

export function QRSection({ name, employeeId }: QRSectionProps) {
  const { profileTab, setProfileTab } = useAppStore();

  return (
    <Card>
      <SegmentTabs
        tabs={[S.profile.myQR, S.profile.scanQR]}
        activeIndex={profileTab}
        onChange={setProfileTab}
        className="mb-4"
      />

      {profileTab === 0 ? (
        <View className="items-center py-4">
          <View className="w-48 h-48 bg-gray-50 dark:bg-gray-800 rounded-2xl items-center justify-center mb-4">
            <QrCode size={120} color="#2563EB" />
          </View>
          <Text className="text-base font-semibold text-gray-900 dark:text-white">
            {name}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {S.profile.employeeId}: {employeeId}
          </Text>
        </View>
      ) : (
        <View className="items-center py-8">
          <View className="w-48 h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl items-center justify-center">
            <QrCode size={48} color="#9CA3AF" />
            <Text className="text-sm text-gray-400 mt-2">
              {S.scan.instruction}
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
}
