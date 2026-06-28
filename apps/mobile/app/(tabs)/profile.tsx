import { ScrollView, View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Camera,
  Building2,
  User as UserIcon,
  CreditCard,
  Globe,
  Fingerprint,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  QrCode,
} from "lucide-react-native";
import { BgsCard } from "@/components/bgs/card";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth-store";

interface StatPillProps {
  value: string;
  label: string;
  textColor: string;
  subColor: string;
}

function StatPill({ value, label, textColor, subColor }: StatPillProps) {
  return (
    <View style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}>
      <Text style={{ fontSize: 19, fontWeight: "800", color: textColor, letterSpacing: -0.4 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: subColor, marginTop: 2, fontWeight: "500" }}>
        {label}
      </Text>
    </View>
  );
}

interface SettingRowProps {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  label: string;
  detail?: string;
  onPress?: () => void;
  hasBorder: boolean;
  textColor: string;
  subColor: string;
  faintColor: string;
  borderColor: string;
}

function SettingRow({
  icon: Icon,
  label,
  detail,
  onPress,
  hasBorder,
  textColor,
  subColor,
  faintColor,
  borderColor,
}: SettingRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 13,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderTopWidth: hasBorder ? 1 : 0,
        borderTopColor: borderColor,
      }}
    >
      <Icon size={20} color={subColor} strokeWidth={1.9} />
      <Text
        style={{
          flex: 1,
          fontSize: 14.5,
          fontWeight: "600",
          color: textColor,
        }}
      >
        {label}
      </Text>
      {detail && <Text style={{ fontSize: 12.5, color: faintColor }}>{detail}</Text>}
      <ChevronRight size={15} color={faintColor} strokeWidth={2.2} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const t = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const biometricAvailable = useAuthStore((s) => s.biometricAvailable);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useAuthStore((s) => s.setBiometricEnabled);

  if (!user) return null;

  const initial = user.name.charAt(0) || "U";
  const empCode = user.employeeId.replace(/^BGS-?/i, "") || user.employeeId;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity card */}
        <BgsCard
          t={t}
          style={{ padding: 22, marginBottom: 18, alignItems: "center" }}
        >
          <View style={{ position: "relative" }}>
            <View
              style={{
                width: 78,
                height: 78,
                borderRadius: 26,
                backgroundColor: t.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 30, fontWeight: "800" }}>{initial}</Text>
            </View>
            <Pressable
              onPress={() =>
                Alert.alert("Зураг солих", "Энэ боломж удахгүй нэмэгдэнэ.")
              }
              style={{
                position: "absolute",
                right: -2,
                bottom: -2,
                width: 26,
                height: 26,
                borderRadius: 9,
                backgroundColor: t.card,
                borderWidth: 1,
                borderColor: t.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Camera size={14} color={t.sub} strokeWidth={1.9} />
            </Pressable>
          </View>
          <Text
            style={{
              fontSize: 19,
              fontWeight: "800",
              color: t.text,
              marginTop: 13,
              letterSpacing: -0.3,
            }}
          >
            {user.name}
          </Text>
          {user.role && (
            <Text style={{ fontSize: 13, color: t.sub, marginTop: 3 }}>{user.role}</Text>
          )}
          {user.department && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 9,
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 9,
                backgroundColor: t.accentSoft,
              }}
            >
              <Building2 size={14} color={t.accent} strokeWidth={1.9} />
              <Text style={{ fontSize: 12, fontWeight: "700", color: t.accent }}>
                {user.department}
              </Text>
            </View>
          )}
        </BgsCard>

        {/* Stats */}
        <BgsCard
          t={t}
          style={{ paddingVertical: 14, paddingHorizontal: 8, marginBottom: 18, flexDirection: "row" }}
        >
          <StatPill value={empCode} label="Ажилтны код" textColor={t.text} subColor={t.sub} />
          <View style={{ width: 1, backgroundColor: t.border }} />
          <StatPill
            value={user.isWorking ? "Идэвхтэй" : "—"}
            label="Төлөв"
            textColor={t.text}
            subColor={t.sub}
          />
          <View style={{ width: 1, backgroundColor: t.border }} />
          <StatPill value="A" label="Ээлж" textColor={t.text} subColor={t.sub} />
        </BgsCard>

        {/* Settings list */}
        <BgsCard t={t} style={{ overflow: "hidden", marginBottom: 18 }}>
          <SettingRow
            icon={QrCode}
            label="Дижитал үнэмлэх / QR"
            onPress={() => router.push("/profile/qr" as never)}
            hasBorder={false}
            textColor={t.text}
            subColor={t.sub}
            faintColor={t.faint}
            borderColor={t.border}
          />
          <SettingRow
            icon={UserIcon}
            label="Хувийн мэдээлэл"
            onPress={() => router.push("/profile/personal-info")}
            hasBorder
            textColor={t.text}
            subColor={t.sub}
            faintColor={t.faint}
            borderColor={t.border}
          />
          <SettingRow
            icon={CreditCard}
            label="Гэрчилгээ ба баримт"
            onPress={() => router.push("/profile/documents")}
            hasBorder
            textColor={t.text}
            subColor={t.sub}
            faintColor={t.faint}
            borderColor={t.border}
          />
          <SettingRow
            icon={Globe}
            label="Хэл"
            detail="Монгол"
            onPress={() =>
              Alert.alert("Хэл", "Одоогоор зөвхөн монгол хэл дэмжигдэнэ.")
            }
            hasBorder
            textColor={t.text}
            subColor={t.sub}
            faintColor={t.faint}
            borderColor={t.border}
          />

          {/* Biometric toggle */}
          {biometricAvailable && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 13,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderTopWidth: 1,
                borderTopColor: t.border,
              }}
            >
              <Fingerprint size={20} color={t.sub} strokeWidth={1.9} />
              <Text style={{ flex: 1, fontSize: 14.5, fontWeight: "600", color: t.text }}>
                Биометрик нэвтрэлт
              </Text>
              <Pressable
                onPress={() => setBiometricEnabled(!biometricEnabled)}
                style={{
                  width: 46,
                  height: 28,
                  borderRadius: 16,
                  backgroundColor: biometricEnabled
                    ? t.accent
                    : t.dark
                    ? "rgba(255,255,255,0.18)"
                    : "#D2D6DD",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: "#fff",
                    transform: [{ translateX: biometricEnabled ? 21 : 3 }],
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                />
              </Pressable>
            </View>
          )}

          {/* Dark mode display (system-driven, info row) */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 13,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderTopColor: t.border,
            }}
          >
            {t.dark ? (
              <Moon size={20} color={t.sub} strokeWidth={1.9} />
            ) : (
              <Sun size={20} color={t.sub} strokeWidth={1.9} />
            )}
            <Text style={{ flex: 1, fontSize: 14.5, fontWeight: "600", color: t.text }}>
              Харанхуй горим
            </Text>
            <Text style={{ fontSize: 12.5, color: t.faint }}>Системээр</Text>
          </View>
        </BgsCard>

        {/* Logout */}
        <Pressable
          onPress={logout}
          style={{
            paddingVertical: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: t.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <LogOut size={19} color="#E5484D" strokeWidth={2} />
          <Text style={{ fontSize: 14.5, fontWeight: "700", color: "#E5484D" }}>
            Системээс гарах
          </Text>
        </Pressable>

        <Text
          style={{
            textAlign: "center",
            marginTop: 16,
            fontSize: 11,
            color: t.faint,
          }}
        >
          BGS Ажилтан · хувилбар 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
