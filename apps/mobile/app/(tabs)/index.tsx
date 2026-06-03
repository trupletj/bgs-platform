import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { HeaderBar } from "@/components/bgs/header-bar";
import { ShiftCard } from "@/components/bgs/shift-card";
import { BgsServiceGrid } from "@/components/bgs/service-grid";
import { BannerCarousel } from "@/components/bgs/banner-carousel";
import { BgsNewsList } from "@/components/bgs/news-list";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { getTheme } from "@/lib/theme";

export default function HomeScreen() {
  const router = useRouter();
  const t = getTheme(false);
  const user = useAuthStore((s) => s.user);

  const workerId = user?.employeeId;

  const { data: attendance } = useQuery({
    queryKey: queryKeys.attendance.week(workerId ?? ""),
    queryFn: () => api.getAttendance(workerId!),
    enabled: !!workerId,
  });

  const { data: services } = useQuery({
    queryKey: queryKeys.services.all,
    queryFn: api.getServices,
  });

  const { data: notifications } = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: api.getNotifications,
  });

  const { data: news } = useQuery({
    queryKey: queryKeys.news.all,
    queryFn: () => api.getNews(),
  });

  const { data: banners } = useQuery({
    queryKey: queryKeys.banners.all,
    queryFn: api.getBanners,
  });

  const todayAttendance = attendance?.days.find((d) => d.status === "current");
  const firstName = user?.name?.split(" ").slice(-1)[0] ?? "Ажилтан";

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <HeaderBar
          t={t}
          greeting="Өглөөний мэнд,"
          name={firstName}
          hasUnread={notifications?.some((n) => !n.read) ?? false}
          onBell={() => router.push("/notifications")}
        />
        <View style={{ paddingHorizontal: 20 }}>
          <ShiftCard
            t={t}
            isWorking={user?.isWorking ?? false}
            checkInTime={todayAttendance?.checkIn}
            shiftLabel={user?.role || "Өнөөдрийн ээлж"}
            department={user?.department}
            onQR={() => router.push("/(tabs)/scan")}
          />
          {services && <BgsServiceGrid t={t} services={services} />}
          <BannerCarousel t={t} banners={banners} />
          {news && (
            <BgsNewsList
              t={t}
              items={news}
              onSeeAll={() => router.push("/news")}
              onItemPress={(id) => router.push(`/news/${id}` as never)}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
