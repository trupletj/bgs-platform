import { useState } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Building2,
  User as UserIcon,
  Globe,
  Moon,
  Sun,
  Monitor,
  LogOut,
  ChevronRight,
  QrCode,
} from "lucide-react-native";
import { BgsCard } from "@/components/bgs/card";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore, type ThemeMode } from "@/stores/theme-store";
import { api } from "@/lib/api";
import { alertDialog } from "@/lib/dialog";
import type { BgsTheme } from "@/lib/theme";

interface StatPillProps {
  value: string;
  label: string;
  textColor: string;
  subColor: string;
}

function StatPill({ value, label, textColor, subColor }: StatPillProps) {
  return (
    <View style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}>
      <Text style={{ fontSize: 18, fontWeight: "800", color: textColor, letterSpacing: -0.4 }} numberOfLines={1}>
        {value || "—"}
      </Text>
      <Text style={{ fontSize: 11, color: subColor, marginTop: 2, fontWeight: "500" }}>{label}</Text>
    </View>
  );
}

interface SettingRowProps {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  label: string;
  detail?: string;
  onPress?: () => void;
  hasBorder: boolean;
  t: BgsTheme;
}

function SettingRow({ icon: Icon, label, detail, onPress, hasBorder, t }: SettingRowProps) {
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
        borderTopColor: t.border,
      }}
    >
      <Icon size={20} color={t.sub} strokeWidth={1.9} />
      <Text style={{ flex: 1, fontSize: 14.5, fontWeight: "600", color: t.text }}>{label}</Text>
      {detail && <Text style={{ fontSize: 12.5, color: t.faint }}>{detail}</Text>}
      <ChevronRight size={15} color={t.faint} strokeWidth={2.2} />
    </Pressable>
  );
}

const THEME_OPTIONS: { key: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { key: "light", label: "Цайвар", Icon: Sun },
  { key: "dark", label: "Гүн", Icon: Moon },
  { key: "system", label: "Систем", Icon: Monitor },
];

export default function ProfileScreen() {
  const t = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setUserAvatar = useAuthStore((s) => s.setUserAvatar);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const initial = user.name.charAt(0) || "U";

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alertDialog("Зураг солих", "Зураг сонгох зөвшөөрөл хэрэгтэй.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    setUploading(true);
    try {
      const url = await api.setAvatar({
        uri: a.uri,
        mime: a.mimeType ?? "image/jpeg",
        name: a.fileName ?? undefined,
      });
      setUserAvatar(url);
    } catch (e: any) {
      alertDialog("Алдаа", e?.message ?? "Зураг хадгалж чадсангүй");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity card */}
        <BgsCard t={t} style={{ padding: 22, marginBottom: 18, alignItems: "center" }}>
          <View style={{ position: "relative" }}>
            {user.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={{ width: 78, height: 78, borderRadius: 26 }}
                contentFit="cover"
              />
            ) : (
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
            )}
            <Pressable
              onPress={pickAvatar}
              disabled={uploading}
              style={{
                position: "absolute",
                right: -2,
                bottom: -2,
                width: 28,
                height: 28,
                borderRadius: 10,
                backgroundColor: t.card,
                borderWidth: 1,
                borderColor: t.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={t.accent} />
              ) : (
                <Camera size={15} color={t.sub} strokeWidth={1.9} />
              )}
            </Pressable>
          </View>
          <Text
            style={{ fontSize: 19, fontWeight: "800", color: t.text, marginTop: 13, letterSpacing: -0.3 }}
          >
            {user.name}
          </Text>
          {user.role && <Text style={{ fontSize: 13, color: t.sub, marginTop: 3 }}>{user.role}</Text>}
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

        {/* Stats: Цаг бүртгэл + Ээлж */}
        <BgsCard
          t={t}
          style={{ paddingVertical: 14, paddingHorizontal: 8, marginBottom: 18, flexDirection: "row" }}
        >
          <StatPill value={user.attendanceNumber} label="Цаг бүртгэл" textColor={t.text} subColor={t.sub} />
          <View style={{ width: 1, backgroundColor: t.border }} />
          <StatPill value={user.shiftName} label="Ээлж" textColor={t.text} subColor={t.sub} />
        </BgsCard>

        {/* Settings list */}
        <BgsCard t={t} style={{ overflow: "hidden", marginBottom: 18 }}>
          <SettingRow
            icon={QrCode}
            label="Дижитал үнэмлэх / QR"
            onPress={() => router.push("/profile/qr" as never)}
            hasBorder={false}
            t={t}
          />
          <SettingRow
            icon={UserIcon}
            label="Хувийн мэдээлэл"
            onPress={() => router.push("/profile/personal-info")}
            hasBorder
            t={t}
          />
          <SettingRow
            icon={Globe}
            label="Хэл"
            detail="Монгол"
            onPress={() => alertDialog("Хэл", "Одоогоор зөвхөн монгол хэл дэмжигдэнэ.")}
            hasBorder
            t={t}
          />
        </BgsCard>

        {/* Харагдац (light/dark/system) */}
        <Text style={{ fontSize: 13, fontWeight: "700", color: t.sub, marginBottom: 8, marginLeft: 4 }}>
          Харагдац
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
          {THEME_OPTIONS.map((opt) => {
            const active = themeMode === opt.key;
            const Icon = opt.Icon;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setThemeMode(opt.key)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: active ? t.accent : t.border,
                  backgroundColor: active ? t.accentSoft : t.card,
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon size={20} color={active ? t.accent : t.sub} strokeWidth={2} />
                <Text style={{ fontSize: 12.5, fontWeight: "700", color: active ? t.accent : t.text }}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

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
          <Text style={{ fontSize: 14.5, fontWeight: "700", color: "#E5484D" }}>Системээс гарах</Text>
        </Pressable>

        <Text style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: t.faint }}>
          BGS Ажилтан · хувилбар 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
