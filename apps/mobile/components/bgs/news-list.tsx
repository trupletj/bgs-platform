import { View, Text, Pressable } from "react-native";
import { Newspaper, ChevronRight } from "lucide-react-native";
import { BgsCard } from "./card";
import { SectionHead } from "./section-head";
import type { BgsTheme } from "@/lib/theme";
import type { NewsItem } from "@/types";

interface NewsListProps {
  t: BgsTheme;
  items: NewsItem[];
  onSeeAll?: () => void;
  onItemPress?: (id: string) => void;
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Дөнгөж сая";
    if (hours < 24) return `${hours} цагийн өмнө`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Өчигдөр";
    return `${days} хоногийн өмнө`;
  } catch {
    return dateStr;
  }
}

export function BgsNewsList({ t, items, onSeeAll, onItemPress }: NewsListProps) {
  if (!items.length) return null;
  const visible = items.slice(0, 3);

  return (
    <View style={{ marginBottom: 8 }}>
      <SectionHead t={t} title="Мэдээ мэдээлэл" action="Бүгд" onAction={onSeeAll} />
      <BgsCard t={t} style={{ overflow: "hidden" }}>
        {visible.map((nw, idx) => (
          <Pressable
            key={nw.id}
            onPress={() => onItemPress?.(nw.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 13,
              padding: 16,
              paddingVertical: 14,
              borderTopWidth: idx ? 1 : 0,
              borderTopColor: t.border,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                flexShrink: 0,
                backgroundColor: t.dark ? "rgba(255,255,255,0.05)" : "#F1F3F6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Newspaper size={19} color={t.sub} strokeWidth={1.9} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: t.text,
                  letterSpacing: -0.2,
                  lineHeight: 18,
                }}
                numberOfLines={2}
              >
                {nw.title}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <Text style={{ fontSize: 10.5, fontWeight: "700", color: t.accent }}>
                  Мэдээ
                </Text>
                <Text style={{ fontSize: 11, color: t.faint }}>· {formatTime(nw.date)}</Text>
              </View>
            </View>
            <ChevronRight size={15} color={t.faint} strokeWidth={2.2} />
          </Pressable>
        ))}
      </BgsCard>
    </View>
  );
}
