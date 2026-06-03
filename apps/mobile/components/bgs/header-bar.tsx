import { View, Text, Pressable } from "react-native";
import { Bell } from "lucide-react-native";
import { BrandMark } from "@/components/brand/brand-mark";
import type { BgsTheme } from "@/lib/theme";

interface HeaderBarProps {
  t: BgsTheme;
  greeting?: string;
  name: string;
  onBell?: () => void;
  hasUnread?: boolean;
}

export function HeaderBar({
  t,
  greeting = "Өглөөний мэнд,",
  name,
  onBell,
  hasUnread = true,
}: HeaderBarProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            backgroundColor: t.accentSoft,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <BrandMark height={24} variant="orange" markOnly background={t.accentSoft} />
        </View>
        <View style={{ marginLeft: 2 }}>
          <Text style={{ fontSize: 12.5, color: t.sub, fontWeight: "500" }}>{greeting}</Text>
          <Text
            style={{
              fontSize: 16.5,
              fontWeight: "700",
              color: t.text,
              letterSpacing: -0.3,
              marginTop: 1,
            }}
          >
            {name}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onBell}
        style={{
          width: 42,
          height: 42,
          borderRadius: 13,
          borderWidth: 1,
          borderColor: t.border,
          backgroundColor: t.card,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Bell size={21} color={t.text} strokeWidth={1.9} />
        {hasUnread && (
          <View
            style={{
              position: "absolute",
              top: 9,
              right: 10,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: t.accent,
              borderWidth: 2,
              borderColor: t.card,
            }}
          />
        )}
      </Pressable>
    </View>
  );
}
