import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { HeaderBar } from "@/components/bgs/header-bar";
import { ServiceList } from "@/components/bgs/service-list";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/hooks/use-theme";

export default function MiniAppsScreen() {
  const t = useTheme();
  const user = useAuthStore((s) => s.user);

  const { data: services } = useQuery({
    queryKey: queryKeys.services.all,
    queryFn: api.getServices,
  });

  const firstName = user?.name?.split(" ").slice(-1)[0] ?? "Ажилтан";

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <HeaderBar t={t} greeting="Өглөөний мэнд," name={firstName} />
        <View style={{ paddingHorizontal: 20 }}>
          {services && <ServiceList t={t} services={services} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
