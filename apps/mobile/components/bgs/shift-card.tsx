import { View, Text, Pressable } from "react-native";
import { QrCode } from "lucide-react-native";
import { BgsCard } from "./card";
import type { BgsTheme } from "@/lib/theme";

interface ShiftCardProps {
  t: BgsTheme;
  isWorking: boolean;
  checkInTime?: string;
  shiftLabel?: string;
  department?: string;
  onQR?: () => void;
}

export function ShiftCard({
  t,
  isWorking,
  checkInTime,
  shiftLabel,
  department,
  onQR,
}: ShiftCardProps) {
  return (
    <BgsCard t={t} style={{ padding: 16, marginBottom: 22 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              marginBottom: 7,
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: isWorking ? "#16A34A" : t.faint,
              }}
            />
            <Text style={{ fontSize: 12.5, fontWeight: "600", color: t.sub }}>
              {isWorking
                ? `Ажилдаа бүртгэгдсэн${checkInTime ? ` · ${checkInTime}` : ""}`
                : "Бүртгэлгүй"}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 15.5,
              fontWeight: "700",
              color: t.text,
              letterSpacing: -0.2,
            }}
          >
            {shiftLabel ?? "Өнөөдрийн ээлж"}
          </Text>
          {department && (
            <Text style={{ fontSize: 12.5, color: t.sub, marginTop: 2 }}>{department}</Text>
          )}
        </View>
        <Pressable
          onPress={onQR}
          style={{
            alignItems: "center",
            gap: 4,
            backgroundColor: t.accentSoft,
            borderRadius: 15,
            paddingVertical: 11,
            paddingHorizontal: 13,
          }}
        >
          <QrCode size={24} color={t.accent} strokeWidth={1.9} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: t.accent }}>Миний QR</Text>
        </Pressable>
      </View>
    </BgsCard>
  );
}
