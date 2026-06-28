import "../global.css";

import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import "react-native-reanimated";

import { useAuthStore } from "@/stores/auth-store";
import { LoadingScreen } from "@/components/bgs/loading-screen";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

const TABLET_MAX_WIDTH = 820;

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, biometricEnabled, isUnlocked } =
    useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "login";
    const onUnlock = segments[0] === "unlock";
    const needsUnlock = isAuthenticated && biometricEnabled && !isUnlocked;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/login");
    } else if (needsUnlock && !onUnlock) {
      router.replace("/unlock");
    } else if (isAuthenticated && !needsUnlock && (inAuthGroup || onUnlock)) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, biometricEnabled, isUnlocked, segments, router]);

  return <>{children}</>;
}

/**
 * Нэвтэрсний дараа хэрэглэгчийн мэдээлэл + нүүрний шаардлагатай датаг кэшлэх
 * хүртэл loading screen-ийг (Stack дээр overlay) харуулна. Бэлэн болмогц алга.
 */
function BootGate({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isUnlocked = useAuthStore((s) => s.isUnlocked);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);
  const error = useAuthStore((s) => s.error);
  const queryClient = useQueryClient();
  const [readyForUser, setReadyForUser] = useState<string | null>(null);

  // Auth + biometric давсан, үндсэн апп руу орох гэж буй төлөв.
  const passedAuth = isAuthenticated && (!biometricEnabled || isUnlocked);

  const userId = user?.id;
  const employeeId = user?.employeeId;

  useEffect(() => {
    if (!passedAuth || !userId || !employeeId) return;
    let cancelled = false;
    void (async () => {
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: queryKeys.attendance.week(employeeId),
          queryFn: () => api.getAttendance(employeeId),
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.services.all,
          queryFn: api.getServices,
        }),
      ]);
      if (!cancelled) setReadyForUser(userId);
    })();
    return () => {
      cancelled = true;
    };
  }, [passedAuth, userId, employeeId, queryClient]);

  const ready = user != null && readyForUser === user.id;
  const showLoading = !isLoading && passedAuth && !ready;

  return (
    <>
      {children}
      {showLoading && <LoadingScreen error={!user && error ? error : undefined} />}
    </>
  );
}

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [fontsLoaded] = useFonts({ SpaceGrotesk_700Bold });

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, fontsLoaded]);

  if (!fontsLoaded) return null;

  const webContainerStyle =
    Platform.OS === "web"
      ? {
          flex: 1,
          width: "100%" as const,
          maxWidth: TABLET_MAX_WIDTH,
          alignSelf: "center" as const,
          backgroundColor: "#EEF0F3",
        }
      : { flex: 1 };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={DefaultTheme}>
        <View style={webContainerStyle}>
          <AuthGate>
            <BootGate>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="login"
                  options={{ headerShown: false, gestureEnabled: false }}
                />
                <Stack.Screen
                  name="unlock"
                  options={{ headerShown: false, gestureEnabled: false }}
                />
                <Stack.Screen name="services" options={{ headerShown: false }} />
                <Stack.Screen name="profile" options={{ headerShown: false }} />
                <Stack.Screen
                  name="modal"
                  options={{ presentation: "modal", title: "Modal" }}
                />
              </Stack>
            </BootGate>
          </AuthGate>
        </View>
        <StatusBar style="dark" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
