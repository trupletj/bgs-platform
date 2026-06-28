import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ui/screen-header";
import { BgsCard } from "@/components/bgs/card";
import { S } from "@/constants/strings";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth-store";
import type { BgsTheme } from "@/lib/theme";

function InfoRow({ t, label, value, last }: { t: BgsTheme; label: string; value: string; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderTopWidth: last ? 0 : 0,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.border,
      }}
    >
      <Text style={{ fontSize: 13.5, color: t.sub }}>{label}</Text>
      <Text
        style={{ fontSize: 13.5, fontWeight: "600", color: t.text, flex: 1, textAlign: "right", marginLeft: 16 }}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

export default function PersonalInfoScreen() {
  const t = useTheme();
  const user = useAuthStore((s) => s.user);
  const P = S.personalInfo;

  if (!user) return null;
  const empCode = user.employeeId.replace(/^BGS-?/i, "") || user.employeeId;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader title={P.title} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 }}>
        <BgsCard t={t} style={{ overflow: "hidden" }}>
          <InfoRow t={t} label={P.name} value={user.name || P.empty} />
          <InfoRow t={t} label={P.role} value={user.role || P.empty} />
          <InfoRow t={t} label={P.department} value={user.department || P.empty} />
          <InfoRow t={t} label={P.heltes} value={user.heltesName || P.empty} />
          <InfoRow t={t} label={P.employeeCode} value={empCode || P.empty} />
          <InfoRow t={t} label={P.attendanceNumber} value={user.attendanceNumber || P.empty} />
          <InfoRow t={t} label={P.email} value={user.email || P.empty} />
          <InfoRow t={t} label={P.phone} value={user.phone || P.empty} last />
        </BgsCard>
        <Text style={{ fontSize: 12, color: t.faint, marginTop: 16, marginHorizontal: 4, lineHeight: 18 }}>
          {P.note}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
