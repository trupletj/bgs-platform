import { View, Text, Pressable } from "react-native";
import { MessageCircle } from "lucide-react-native";
import type { BgsTheme } from "@/lib/theme";
import type { Contact } from "@/types";
import { avatarColor, avatarSoft } from "@/lib/avatar-color";

interface ContactListItemProps {
  t: BgsTheme;
  contact: Contact;
  hasBorder: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export function ContactListItem({ t, contact, hasBorder, onPress, onLongPress }: ContactListItemProps) {
  const initial = (contact.name || "?").charAt(0);
  const subtitle = [contact.positionName, contact.heltesName].filter(Boolean).join(" · ");

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
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
          backgroundColor: avatarSoft(contact.name),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: "800", color: avatarColor(contact.name) }}>
          {initial}
        </Text>
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: t.text }} numberOfLines={1}>
          {contact.name || "—"}
        </Text>
        {!!subtitle && (
          <Text style={{ fontSize: 12.5, color: t.sub }} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <MessageCircle size={20} color={t.accent} strokeWidth={2} />
    </Pressable>
  );
}
