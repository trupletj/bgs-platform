import { View, Text, Pressable, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { BgsCard } from "./card";
import { SectionHead } from "./section-head";
import { getServiceIcon } from "@/lib/icon-map";
import type { BgsTheme } from "@/lib/theme";
import type { ServiceItem } from "@/types";

interface ServiceListProps {
  t: BgsTheme;
  services: ServiceItem[];
}

/** Үйлчилгээг доош жагссан list хэлбэрээр харуулна */
export function ServiceList({ t, services }: ServiceListProps) {
  const router = useRouter();

  const onService = (s: ServiceItem) => {
    if (s.route) {
      router.push(s.route as never);
    } else {
      Alert.alert(s.title, "Энэ үйлчилгээ удахгүй нэмэгдэнэ.");
    }
  };

  return (
    <View style={{ marginBottom: 22 }}>
      <SectionHead t={t} title="Үйлчилгээ" />
      <BgsCard t={t} style={{ overflow: "hidden" }}>
        {services.map((s, i) => {
          const Icon = s.iconAsset ? null : getServiceIcon(s.icon);
          return (
            <Pressable
              key={s.id}
              onPress={() => onService(s)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderTopWidth: i > 0 ? 1 : 0,
                borderTopColor: t.border,
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 15,
                  backgroundColor: t.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {s.iconAsset ? (
                  <Image
                    source={s.iconAsset}
                    style={{ width: 30, height: 30 }}
                    resizeMode="contain"
                  />
                ) : Icon ? (
                  <Icon size={24} color={t.accent} />
                ) : null}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{ fontSize: 15, fontWeight: "700", color: t.text, letterSpacing: -0.2 }}
                  numberOfLines={1}
                >
                  {s.title}
                </Text>
                {s.description ? (
                  <Text style={{ fontSize: 12.5, color: t.sub }} numberOfLines={2}>
                    {s.description}
                  </Text>
                ) : null}
              </View>
              <ChevronRight size={18} color={t.faint} strokeWidth={2} />
            </Pressable>
          );
        })}
      </BgsCard>
    </View>
  );
}
