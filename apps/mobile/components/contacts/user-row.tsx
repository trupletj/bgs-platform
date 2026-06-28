import { View, Text, Pressable } from "react-native";
import { Check } from "lucide-react-native";
import type { BgsTheme } from "@/lib/theme";
import type { DirectoryUser } from "@/types";
import { S } from "@/constants/strings";
import { avatarColor, avatarSoft } from "@/lib/avatar-color";

interface UserRowProps {
  t: BgsTheme;
  user: DirectoryUser;
  hasBorder: boolean;
  onAdd: (user: DirectoryUser) => void;
  onAccept: (user: DirectoryUser) => void;
  pending?: boolean;
}

export function UserRow({ t, user, hasBorder, onAdd, onAccept, pending }: UserRowProps) {
  const initial = (user.name || "?").charAt(0);
  const subtitle = [user.positionName, user.heltesName].filter(Boolean).join(" · ");

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 13,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: hasBorder ? 1 : 0,
        borderTopColor: t.border,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 15,
          backgroundColor: avatarSoft(user.name),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: "800", color: avatarColor(user.name) }}>
          {initial}
        </Text>
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: t.text }} numberOfLines={1}>
          {user.name || "—"}
        </Text>
        {!!subtitle && (
          <Text style={{ fontSize: 12.5, color: t.sub }} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Status-aware action */}
      {user.contactStatus === "accepted" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Check size={15} color={t.sub} strokeWidth={2.5} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: t.sub }}>{S.contacts.friend}</Text>
        </View>
      ) : user.contactStatus === "pending_out" ? (
        <Text style={{ fontSize: 12.5, fontWeight: "600", color: t.faint }}>
          {S.contacts.pendingOut}
        </Text>
      ) : user.contactStatus === "pending_in" ? (
        <Pressable
          onPress={() => !pending && onAccept(user)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 10,
            backgroundColor: t.accent,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>
            {S.contacts.accept}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => !pending && onAdd(user)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 10,
            backgroundColor: t.accentSoft,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: t.accent }}>
            {S.contacts.addFriend}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
