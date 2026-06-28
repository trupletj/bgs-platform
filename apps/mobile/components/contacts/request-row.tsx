import { View, Text, Pressable } from "react-native";
import { Check, X } from "lucide-react-native";
import type { BgsTheme } from "@/lib/theme";
import type { ContactRequest } from "@/types";

interface RequestRowProps {
  t: BgsTheme;
  request: ContactRequest;
  hasBorder: boolean;
  onAccept: (req: ContactRequest) => void;
  onDecline: (req: ContactRequest) => void;
  disabled?: boolean;
}

export function RequestRow({ t, request, hasBorder, onAccept, onDecline, disabled }: RequestRowProps) {
  const initial = (request.name || "?").charAt(0);

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
          backgroundColor: t.accentSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: "800", color: t.accent }}>{initial}</Text>
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: t.text }} numberOfLines={1}>
          {request.name || "—"}
        </Text>
        {!!request.positionName && (
          <Text style={{ fontSize: 12.5, color: t.sub }} numberOfLines={1}>
            {request.positionName}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable
          onPress={() => !disabled && onDecline(request)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: t.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} color={t.sub} strokeWidth={2.2} />
        </Pressable>
        <Pressable
          onPress={() => !disabled && onAccept(request)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: t.accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={18} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}
