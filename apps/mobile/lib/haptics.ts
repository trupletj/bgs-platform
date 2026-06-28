import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

/** Хөнгөн мэдрэхүй (товч, илгээх) */
export function tapLight() {
  if (Platform.OS === "web") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Амжилттай үйлдэл (зөвшөөрөх, нэмэх) */
export function tapSuccess() {
  if (Platform.OS === "web") return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
