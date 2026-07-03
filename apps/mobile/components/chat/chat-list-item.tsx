import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { Users, BadgeCheck, BellOff } from "lucide-react-native";
import type { BgsTheme } from "@/lib/theme";
import type { ChatThread } from "@/types";
import { avatarColor, avatarSoft } from "@/lib/avatar-color";

interface ChatListItemProps {
  t: BgsTheme;
  thread: ChatThread;
  hasBorder: boolean;
  onPress: () => void;
}

export function ChatListItem({ t, thread, hasBorder, onPress }: ChatListItemProps) {
  const initial = thread.name.charAt(0) || "?";
  // direct чатад нэрээр өнгө; official/group нь брэнд өнгөтэй
  const direct = !thread.isGroup && !thread.isOfficial;
  const avBg = thread.isOfficial ? t.accent : direct ? avatarSoft(thread.name) : t.accentSoft;
  const avFg = thread.isOfficial ? "#fff" : direct ? avatarColor(thread.name) : t.accent;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        paddingHorizontal: 6,
        paddingVertical: 9,
        borderTopWidth: hasBorder ? 1 : 0,
        borderTopColor: t.border,
      }}
    >
      {/* Avatar */}
      {thread.avatarUrl ? (
        <Image
          source={{ uri: thread.avatarUrl }}
          style={{ width: 50, height: 50, borderRadius: 17 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 17,
            backgroundColor: avBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {thread.isGroup ? (
            <Users
              size={23}
              color={thread.isOfficial ? "#fff" : t.accent}
              strokeWidth={2}
            />
          ) : (
            <Text
              style={{
                fontSize: 19,
                fontWeight: "800",
                color: avFg,
              }}
            >
              {initial}
            </Text>
          )}
        </View>
      )}

      {/* Name + last message */}
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Text
            style={{ fontSize: 15.5, fontWeight: "700", color: t.text, letterSpacing: -0.2 }}
            numberOfLines={1}
          >
            {thread.name}
          </Text>
          {thread.isOfficial && (
            <BadgeCheck size={14} color={t.accent} strokeWidth={2.2} />
          )}
        </View>
        <Text style={{ fontSize: 13, color: t.sub }} numberOfLines={1}>
          {thread.lastMessage}
        </Text>
      </View>

      {/* Time + unread */}
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          {thread.muted && <BellOff size={13} color={t.faint} strokeWidth={2} />}
          <Text style={{ fontSize: 11.5, color: t.faint }}>{thread.time}</Text>
        </View>
        {thread.unread > 0 &&
          (thread.muted ? (
            <View
              style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: t.faint }}
            />
          ) : (
            <View
              style={{
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: t.accent,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#fff" }}>
                {thread.unread > 99 ? "99+" : thread.unread}
              </Text>
            </View>
          ))}
      </View>
    </Pressable>
  );
}
