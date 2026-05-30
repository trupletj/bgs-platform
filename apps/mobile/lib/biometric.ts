import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { S } from "@/constants/strings";

const BIOMETRIC_KEY = "bgs_biometric_enabled";

export async function checkBiometricSupport(): Promise<{ supported: boolean }> {
  if (Platform.OS === "web") return { supported: false };
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return { supported: false };
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return { supported: isEnrolled };
}

export async function getBiometricEnabled(): Promise<boolean> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(BIOMETRIC_KEY) === "true";
  }
  const value = await SecureStore.getItemAsync(BIOMETRIC_KEY);
  return value === "true";
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BIOMETRIC_KEY, enabled ? "true" : "false");
    return;
  }
  await SecureStore.setItemAsync(BIOMETRIC_KEY, enabled ? "true" : "false");
}

export async function promptBiometric(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (Platform.OS === "web") {
    return { success: false, error: "unsupported" };
  }
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: S.biometric.promptMessage,
    cancelLabel: S.biometric.promptCancel,
    disableDeviceFallback: true,
  });

  return {
    success: result.success,
    error: result.success ? undefined : result.error,
  };
}
