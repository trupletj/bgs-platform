import { Alert, Platform } from "react-native";

/**
 * Cross-platform баталгаажуулалт. Native дээр Alert, web дээр window.confirm.
 * (React Native Web дээр Alert-ийн олон товч ажилладаггүй тул.)
 */
export function confirmDialog(opts: {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  const {
    title,
    message,
    confirmText = "Тийм",
    cancelText = "Болих",
    destructive,
    onConfirm,
  } = opts;

  if (Platform.OS === "web") {
    const ok =
      typeof window !== "undefined" &&
      window.confirm([title, message].filter(Boolean).join("\n\n"));
    if (ok) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: cancelText, style: "cancel" },
    { text: confirmText, style: destructive ? "destructive" : "default", onPress: onConfirm },
  ]);
}

/** Cross-platform мэдэгдэл (нэг товч). */
export function alertDialog(title: string, message?: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert([title, message].filter(Boolean).join("\n\n"));
    return;
  }
  Alert.alert(title, message);
}
