import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fingerprint } from "lucide-react-native";
import { useAuthStore } from "@/stores/auth-store";
import { promptBiometric } from "@/lib/biometric";
import { S } from "@/constants/strings";

export default function UnlockScreen() {
  const user = useAuthStore((s) => s.user);
  const phone = useAuthStore((s) => s.phone);
  const setUnlocked = useAuthStore((s) => s.setUnlocked);
  const logout = useAuthStore((s) => s.logout);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleBiometric = async () => {
    setError(false);
    setLoading(true);
    const result = await promptBiometric();
    setLoading(false);
    if (result.success) {
      setUnlocked();
    } else {
      setError(true);
    }
  };

  const displayName = user?.name ?? `+976${phone}`;
  const initial = user?.name ? user.name.charAt(0) : phone.charAt(0) ?? "?";

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950 items-center justify-center px-8">
      <View className="items-center w-full">
        <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6">
          <Text className="text-3xl font-bold text-primary">{initial}</Text>
        </View>

        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1 text-center">
          {displayName}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-10">
          {S.biometric.unlockSubtitle}
        </Text>

        {error && (
          <Text className="text-danger text-sm text-center mb-4">
            Биометрик баталгаажуулалт амжилтгүй боллоо
          </Text>
        )}

        <Pressable
          onPress={handleBiometric}
          disabled={loading}
          className="w-full bg-primary py-3.5 rounded-xl flex-row items-center justify-center gap-2 mb-3 active:opacity-80 disabled:opacity-50"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Fingerprint size={20} color="#fff" />
              <Text className="text-white font-semibold text-base">
                {S.auth.loginTitle}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={logout}
          className="w-full py-3.5 rounded-xl items-center active:opacity-70"
        >
          <Text className="text-gray-500 dark:text-gray-400 font-medium text-sm">
            {S.biometric.fallbackButton}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
