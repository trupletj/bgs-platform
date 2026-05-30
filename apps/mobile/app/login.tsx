import { useState } from "react";
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

export default function LoginScreen() {
  const router = useRouter();
  const { verifyUser, sendOtp, verifyLoading, error, clearError } =
    useAuthStore();

  const [register, setRegister] = useState("");
  const [phone, setPhone] = useState("");
  const [localError, setLocalError] = useState("");

  const validate = (): boolean => {
    if (register.length !== 10) {
      setLocalError("Регистрийн дугаар 10 тэмдэгт байх ёстой");
      return false;
    }
    if (!/^\d{8}$/.test(phone)) {
      setLocalError("Утасны дугаар 8 оронтой тоо байх ёстой");
      return false;
    }
    setLocalError("");
    return true;
  };

  const handleSubmit = async () => {
    clearError();
    if (!validate()) return;

    try {
      await verifyUser(phone, register);
      await sendOtp(phone, register);
      router.push("/otp");
    } catch {
      // error is set in store
    }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center px-6"
      >
        <View className="mb-10">
          <Text className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center">
            {S.auth.loginTitle}
          </Text>
        </View>

        <View className="gap-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {S.auth.registerNumber}
            </Text>
            <TextInput
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 text-base text-gray-900 dark:text-gray-100"
              placeholder={S.auth.registerPlaceholder}
              placeholderTextColor="#9ca3af"
              value={register}
              onChangeText={(t) => {
                setRegister(t.toUpperCase());
                setLocalError("");
                clearError();
              }}
              autoCapitalize="characters"
              maxLength={10}
              autoCorrect={false}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {S.auth.phoneNumber}
            </Text>
            <TextInput
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 text-base text-gray-900 dark:text-gray-100"
              placeholder={S.auth.phonePlaceholder}
              placeholderTextColor="#9ca3af"
              value={phone}
              onChangeText={(t) => {
                setPhone(t.replace(/\D/g, ""));
                setLocalError("");
                clearError();
              }}
              keyboardType="phone-pad"
              maxLength={8}
            />
          </View>

          {displayError ? (
            <Text className="text-danger text-sm text-center">
              {displayError}
            </Text>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={verifyLoading}
            className="bg-primary rounded-xl py-4 mt-2 items-center active:opacity-80"
          >
            {verifyLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {S.auth.sendOtp}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
