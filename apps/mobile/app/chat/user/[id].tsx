import { View, Text, Pressable, ScrollView, Switch, Linking, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone, Briefcase, Building2, BellOff, EyeOff } from "lucide-react-native";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useTheme } from "@/hooks/use-theme";
import { ScreenHeader } from "@/components/ui/screen-header";
import { S } from "@/constants/strings";
import { confirmDialog } from "@/lib/dialog";
import { avatarColor, avatarSoft } from "@/lib/avatar-color";

export default function ChatUserScreen() {
  const t = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const threadId = String(id);

  const { data: peer, isLoading } = useQuery({
    queryKey: queryKeys.chat.directPeer(threadId),
    queryFn: () => api.getDirectPeer(threadId),
  });

  const { data: threads } = useQuery({
    queryKey: queryKeys.chat.threads,
    queryFn: api.getChatThreads,
  });
  const thread = threads?.find((th) => th.id === threadId);
  const muted = thread?.muted ?? false;

  const muteMutation = useMutation({
    mutationFn: (v: boolean) => api.setMute(threadId, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.chat.threads }),
  });
  const hideMutation = useMutation({
    mutationFn: () => api.hideConversation(threadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.chat.threads });
      router.dismissAll();
    },
  });

  const confirmHide = () => {
    confirmDialog({
      title: S.chat.hideChat,
      message: S.chat.hideChatConfirm,
      confirmText: S.chat.hideChat,
      destructive: true,
      onConfirm: () => hideMutation.mutate(),
    });
  };

  const name = peer?.name || thread?.name || "Чат";
  const avatarUrl = peer?.avatarUrl ?? thread?.avatarUrl;
  const initial = (name.charAt(0) || "?").toUpperCase();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader title={S.chat.userInfo} />

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={t.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {/* Profile толгой */}
          <View style={{ alignItems: "center", paddingVertical: 24, gap: 12 }}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: 92, height: 92, borderRadius: 30 }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: 30,
                  backgroundColor: avatarSoft(name),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 38, fontWeight: "800", color: avatarColor(name) }}>
                  {initial}
                </Text>
              </View>
            )}
            <Text style={{ fontSize: 20, fontWeight: "800", color: t.text, letterSpacing: -0.3 }}>
              {name}
            </Text>
            {!!peer?.positionName && (
              <Text style={{ fontSize: 13.5, color: t.sub, marginTop: -4 }}>
                {peer.positionName}
              </Text>
            )}
          </View>

          {/* Мэдээлэл */}
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: t.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: t.border,
              overflow: "hidden",
            }}
          >
            {!!peer?.phone && (
              <InfoRow
                t={t}
                icon={<Phone size={19} color={t.accent} strokeWidth={2} />}
                label={S.personalInfo.phone}
                value={peer.phone}
                onPress={() => Linking.openURL(`tel:${peer.phone}`)}
                border={false}
              />
            )}
            {!!peer?.positionName && (
              <InfoRow
                t={t}
                icon={<Briefcase size={19} color={t.accent} strokeWidth={2} />}
                label={S.personalInfo.role}
                value={peer.positionName}
                border
              />
            )}
            {!!peer?.heltesName && (
              <InfoRow
                t={t}
                icon={<Building2 size={19} color={t.accent} strokeWidth={2} />}
                label={S.personalInfo.heltes}
                value={peer.heltesName}
                border
              />
            )}
          </View>

          {/* Тохиргоо */}
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              backgroundColor: t.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: t.border,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <BellOff size={19} color={t.sub} strokeWidth={2} />
              <Text style={{ flex: 1, fontSize: 15, color: t.text, fontWeight: "500" }}>
                {S.chat.mute}
              </Text>
              <Switch
                value={muted}
                onValueChange={(v) => muteMutation.mutate(v)}
                trackColor={{ true: t.accent }}
              />
            </View>
            <View style={{ height: 1, backgroundColor: t.border, marginLeft: 47 }} />
            <Pressable
              onPress={confirmHide}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <EyeOff size={19} color="#E5484D" strokeWidth={2} />
              <Text style={{ flex: 1, fontSize: 15, color: "#E5484D", fontWeight: "600" }}>
                {S.chat.hideChat}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function InfoRow({
  t,
  icon,
  label,
  value,
  onPress,
  border,
}: {
  t: ReturnType<typeof useTheme>;
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
  border: boolean;
}) {
  const Body = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderTopWidth: border ? 1 : 0,
        borderTopColor: t.border,
      }}
    >
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: t.faint, marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 15, color: t.text, fontWeight: "500" }}>{value}</Text>
      </View>
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{Body}</Pressable> : Body;
}
