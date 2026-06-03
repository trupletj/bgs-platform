import { useEffect, useState } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type { BgsTheme } from "@/lib/theme";
import type { Banner } from "@/types";

/** Banner-ийн харьцаа — bgs.mn-ийн crop (BANNER_ASPECT)-тэй ижил байх ёстой. */
const BANNER_ASPECT = 2.5;

interface BannerCarouselProps {
  t: BgsTheme;
  banners?: Banner[];
}

export function BannerCarousel({ t, banners }: BannerCarouselProps) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const items = banners ?? [];
  const n = items.length;

  useEffect(() => {
    setI(0);
  }, [n]);

  useEffect(() => {
    if (n <= 1) return;
    const id = setInterval(() => setI((p) => (p + 1) % n), 4200);
    return () => clearInterval(id);
  }, [n]);

  if (n === 0) return null;

  const banner = items[i] ?? items[0];

  const onPress = () => {
    if (banner.newsId) {
      router.push(`/news/${banner.newsId}` as never);
    } else if (banner.linkUrl) {
      Linking.openURL(banner.linkUrl).catch(() => {});
    }
  };

  const tappable = Boolean(banner.newsId || banner.linkUrl);

  return (
    <View style={{ marginBottom: 22 }}>
      <Pressable
        onPress={tappable ? onPress : undefined}
        style={{
          borderRadius: 18,
          overflow: "hidden",
          width: "100%",
          aspectRatio: BANNER_ASPECT,
          backgroundColor: t.card,
          position: "relative",
        }}
      >
        <Image
          source={{ uri: banner.imageUrl }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
        />
        {/* Уншигдахуйц болгох зөөлөн gradient — доошоо бараавтар */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.05)", "rgba(0,0,0,0.7)"]}
          locations={[0, 0.45, 1]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 16,
            paddingTop: 44,
            paddingBottom: 14,
          }}
        >
          {banner.tag ? (
            <View
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: 9,
                paddingVertical: 3,
                borderRadius: 7,
                marginBottom: 7,
                backgroundColor: t.accent,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  letterSpacing: 0.6,
                  color: "#fff",
                  textTransform: "uppercase",
                }}
              >
                {banner.tag}
              </Text>
            </View>
          ) : null}
          <Text
            numberOfLines={1}
            style={{ fontSize: 17, fontWeight: "800", letterSpacing: -0.3, color: "#fff" }}
          >
            {banner.title}
          </Text>
          {banner.subtitle ? (
            <Text
              numberOfLines={1}
              style={{ fontSize: 12.5, marginTop: 2, color: "rgba(255,255,255,0.9)" }}
            >
              {banner.subtitle}
            </Text>
          ) : null}
        </LinearGradient>
      </Pressable>

      {n > 1 ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
            marginTop: 11,
          }}
        >
          {items.map((_, idx) => (
            <Pressable
              key={idx}
              onPress={() => setI(idx)}
              style={{
                height: 6,
                borderRadius: 3,
                width: idx === i ? 18 : 6,
                backgroundColor: idx === i ? t.accent : t.border,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
