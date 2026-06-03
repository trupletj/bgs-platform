import { View, Text, Pressable, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { BgsCard } from "./card";
import { SectionHead } from "./section-head";
import { getServiceIcon } from "@/lib/icon-map";
import type { BgsTheme } from "@/lib/theme";
import type { ServiceItem } from "@/types";

interface ServiceGridProps {
  t: BgsTheme;
  services: ServiceItem[];
}

interface ServiceCardProps {
  t: BgsTheme;
  service: ServiceItem;
  onPress: () => void;
}

function ServiceCard({ t, service, onPress }: ServiceCardProps) {
  const Icon = service.iconAsset ? null : getServiceIcon(service.icon);
  return (
    <Pressable onPress={onPress} style={{ flexBasis: "48%" }}>
      <BgsCard
        t={t}
        style={{
          padding: 14,
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: t.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {service.iconAsset ? (
            <Image
              source={service.iconAsset}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          ) : Icon ? (
            <Icon size={26} color={t.accent} />
          ) : null}
        </View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: t.text,
            letterSpacing: -0.2,
          }}
          numberOfLines={2}
        >
          {service.title}
        </Text>
        {service.description ? (
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: t.sub,
              lineHeight: 16,
            }}
            numberOfLines={3}
          >
            {service.description}
          </Text>
        ) : null}
      </BgsCard>
    </Pressable>
  );
}

export function BgsServiceGrid({ t, services }: ServiceGridProps) {
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
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {services.map((s) => (
          <ServiceCard key={s.id} t={t} service={s} onPress={() => onService(s)} />
        ))}
      </View>
    </View>
  );
}
