import { View, Text, Pressable, Switch } from "react-native";
import { FolderOpen, Settings, LogOut, ChevronRight, Fingerprint } from "lucide-react-native";
import { S } from "@/constants/strings";

interface ProfileActionsProps {
  onLogout: () => void;
  biometricAvailable?: boolean;
  biometricEnabled?: boolean;
  onToggleBiometric?: (enabled: boolean) => void;
}

const actions = [
  { label: S.profile.files, icon: FolderOpen, color: "#2563EB" },
  { label: S.profile.settings, icon: Settings, color: "#6B7280" },
];

export function ProfileActions({
  onLogout,
  biometricAvailable,
  biometricEnabled,
  onToggleBiometric,
}: ProfileActionsProps) {
  return (
    <View className="mt-4">
      {actions.map((action) => (
        <Pressable
          key={action.label}
          className="flex-row items-center py-4 border-b border-gray-100 dark:border-gray-800"
        >
          <action.icon size={20} color={action.color} />
          <Text className="flex-1 ml-3 text-sm font-medium text-gray-900 dark:text-white">
            {action.label}
          </Text>
          <ChevronRight size={16} color="#9CA3AF" />
        </Pressable>
      ))}

      {biometricAvailable && (
        <View className="flex-row items-center py-4 border-b border-gray-100 dark:border-gray-800">
          <Fingerprint size={20} color="#2563EB" />
          <View className="flex-1 ml-3">
            <Text className="text-sm font-medium text-gray-900 dark:text-white">
              {S.biometric.toggle}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {S.biometric.toggleDescription}
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={onToggleBiometric}
            trackColor={{ false: "#D1D5DB", true: "#2563EB" }}
            thumbColor="#FFFFFF"
          />
        </View>
      )}

      <Pressable
        onPress={onLogout}
        className="flex-row items-center py-4"
      >
        <LogOut size={20} color="#EF4444" />
        <Text className="flex-1 ml-3 text-sm font-medium text-red-500">
          {S.profile.logout}
        </Text>
      </Pressable>
    </View>
  );
}
