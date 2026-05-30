import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { S } from "@/constants/strings";

const RESEND_SECONDS = 60;

export default function OtpScreen() {
  const router = useRouter();
  const { phone, verifyOtp, sendOtp, otpLoading, verifyLoading, error, clearError } =
    useAuthStore();

  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    clearError();
    try {
      await verifyOtp(phone, code);
      // AuthGate in _layout will redirect to (tabs)
    } catch {
      // error is set in store
    }
  };

  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    clearError();
    setCode("");
    try {
      await sendOtp(phone, "");
      setCountdown(RESEND_SECONDS);
    } catch {
      // error is set in store
    }
  }, [countdown, phone, sendOtp, clearError]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center px-6"
      >
        <Pressable onPress={() => router.back()} className="mb-6">
          <Text className="text-primary text-base">{S.auth.back}</Text>
        </Pressable>

        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center">
            {S.auth.otpTitle}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
            +976{phone} {S.auth.otpDescription}
          </Text>
        </View>

        <View className="gap-4">
          <TextInput
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-4 text-2xl text-center tracking-[12px] text-gray-900 dark:text-gray-100"
            value={code}
            onChangeText={(t) => {
              setCode(t.replace(/\D/g, ""));
              clearError();
            }}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          {error ? (
            <Text className="text-danger text-sm text-center">{error}</Text>
          ) : null}

          <Pressable
            onPress={handleVerify}
            disabled={otpLoading || code.length !== 6}
            className="bg-primary rounded-xl py-4 items-center active:opacity-80 disabled:opacity-50"
          >
            {otpLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {S.auth.verify}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleResend}
            disabled={countdown > 0 || verifyLoading}
            className="items-center py-3"
          >
            {verifyLoading ? (
              <ActivityIndicator />
            ) : countdown > 0 ? (
              <Text className="text-gray-400">
                {S.auth.resendIn} {countdown} {S.auth.seconds}
              </Text>
            ) : (
              <Text className="text-primary font-medium">
                {S.auth.resendOtp}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
