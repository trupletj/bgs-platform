import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fingerprint } from "lucide-react-native";
import { useAuthStore } from "@/stores/auth-store";
import { promptBiometric } from "@/lib/biometric";
import { S } from "@/constants/strings";

export default function UnlockScreen() {
  const setUnlocked = useAuthStore((s) => s.setUnlocked);
  const logout = useAuthStore((s) => s.logout);
  const setBiometricEnabled = useAuthStore((s) => s.setBiometricEnabled);
  const [error, setError] = useState(false);

  const handleFallbackLogout = async () => {
    await setBiometricEnabled(false);
    await logout();
  };

  const authenticate = async () => {
    setError(false);
    const result = await promptBiometric();
    if (result.success) {
      setUnlocked();
    } else {
      setError(true);
    }
  };

  // initialize() already attempted biometric on app launch.
  // This screen is the manual retry/fallback UI — no auto-prompt on mount.

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950 items-center justify-center px-8">
      <View className="items-center">
        <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6">
          <Fingerprint size={40} color="#2563EB" />
        </View>

        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {S.biometric.unlockTitle}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-10">
          {S.biometric.unlockSubtitle}
        </Text>

        {error && (
          <Text className="text-danger text-sm text-center mb-4">
            {S.biometric.promptCancel}
          </Text>
        )}

        <Pressable
          onPress={authenticate}
          className="w-full bg-primary py-3.5 rounded-xl items-center mb-3"
        >
          <Text className="text-white font-semibold text-sm">
            {S.biometric.retryButton}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleFallbackLogout}
          className="w-full py-3.5 rounded-xl items-center"
        >
          <Text className="text-gray-500 dark:text-gray-400 font-medium text-sm">
            {S.biometric.fallbackButton}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
