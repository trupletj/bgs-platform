import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { api } from "@/lib/api";

// Идэвхтэй нээлттэй чатын threadId — тухайн чатад байхад foreground banner
// харуулахгүй (чат дотор realtime-аар шинэчлэгдэж байгаа).
let activeThreadId: string | null = null;
export function setActiveChatThread(id: string | null) {
  activeThreadId = id;
}

// Logout үед серверээс устгахын тулд хамгийн сүүлд бүртгэсэн token-ийг хадгална.
let lastPushToken: string | null = null;

/** App эхлэхэд нэг удаа: foreground notification-ийн харагдах байдлыг тохируулна. */
export function configureNotificationHandler() {
  if (Platform.OS === "web") return;
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const convId = notification.request.content.data?.conversationId;
      // Хэрэглэгч тухайн чат дотор байгаа бол banner/sound гаргахгүй
      const inActiveThread =
        convId != null && String(convId) === activeThreadId;
      return {
        shouldShowBanner: !inActiveThread,
        shouldShowList: !inActiveThread,
        shouldPlaySound: !inActiveThread,
        shouldSetBadge: false,
      };
    },
  });
}

/**
 * Push зөвшөөрөл асууж, Expo push token авч серверт хадгална.
 * web дээр болон emulator дээр алгасна. projectId байхгүй бол no-op.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    // EAS projectId тохируулагдаагүй — push token авах боломжгүй.
    console.warn("[push] EAS projectId not set; skipping push registration");
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    lastPushToken = token;
    await api.savePushToken(token, Platform.OS);
    return token;
  } catch (e) {
    console.warn("[push] failed to get/save push token", e);
    return null;
  }
}

/** Logout үед серверээс token-оо устгана. */
export async function unregisterPushNotificationsAsync(): Promise<void> {
  if (!lastPushToken) return;
  try {
    await api.deletePushToken(lastPushToken);
  } catch {
    // үл хайхрах
  }
  lastPushToken = null;
}

/**
 * Notification дээр дарахад чат руу шилжих listener.
 * Cold start (getLastNotificationResponseAsync) + warm-ийг хоёуланг хамаарна.
 * @returns цэвэрлэх функц
 */
export function addNotificationResponseListener(
  onSelectThread: (threadId: string) => void
): () => void {
  if (Platform.OS === "web") return () => {};

  const handle = (response: Notifications.NotificationResponse | null) => {
    const convId = response?.notification.request.content.data?.conversationId;
    if (convId != null) onSelectThread(String(convId));
  };

  // Cold start: апп хаалттай байхад push дарж нээсэн бол
  Notifications.getLastNotificationResponseAsync().then(handle);

  const sub = Notifications.addNotificationResponseReceivedListener((r) => handle(r));
  return () => sub.remove();
}
