import { Pressable, Text, View, useColorScheme, StyleSheet } from "react-native";

interface SegmentTabsProps {
  tabs: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  className?: string;
}

export function SegmentTabs({ tabs, activeIndex, onChange, className = "" }: SegmentTabsProps) {
  const dark = useColorScheme() === "dark";

  return (
    <View
      className={className}
      style={{
        flexDirection: "row",
        backgroundColor: dark ? "#1f2937" : "#f3f4f6",
        borderRadius: 12,
        padding: 4,
      }}
    >
      {tabs.map((tab, index) => {
        const active = index === activeIndex;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(index)}
            style={[
              styles.tab,
              active && {
                backgroundColor: dark ? "#374151" : "#ffffff",
                ...styles.activeShadow,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: active
                  ? dark
                    ? "#ffffff"
                    : "#111827"
                  : dark
                    ? "#9ca3af"
                    : "#6b7280",
              }}
            >
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  activeShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
});
