import { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Plus, MessageSquarePlus, Users, QrCode, Compass } from "lucide-react-native";
import { SearchBar } from "@/components/ui/search-bar";
import { S } from "@/constants/strings";
import type { BgsTheme } from "@/lib/theme";

interface ChatHeaderProps {
  t: BgsTheme;
  search: string;
  onSearch: (v: string) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  onDiscover: () => void;
  onScan: () => void;
}

interface MenuItem {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  label: string;
  onPress: () => void;
}

export function ChatHeader({
  t,
  search,
  onSearch,
  onNewChat,
  onNewGroup,
  onDiscover,
  onScan,
}: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const items: MenuItem[] = [
    { icon: MessageSquarePlus, label: S.chat.newChat, onPress: onNewChat },
    { icon: Users, label: S.chat.newGroup, onPress: onNewGroup },
    { icon: Compass, label: S.chat.discover, onPress: onDiscover },
    { icon: QrCode, label: S.chat.scanQR, onPress: onScan },
  ];

  const handle = (fn: () => void) => {
    setMenuOpen(false);
    fn();
  };

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <Text style={{ fontSize: 26, fontWeight: "800", color: t.text, letterSpacing: -0.5 }}>
          {S.chat.title}
        </Text>
        <Pressable
          onPress={() => setMenuOpen(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 13,
            backgroundColor: t.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={22} color={t.accent} strokeWidth={2.2} />
        </Pressable>
      </View>

      <SearchBar value={search} onChangeText={onSearch} placeholder={S.chat.search} />

      {/* Dropdown menu */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setMenuOpen(false)}>
          <View
            style={{
              position: "absolute",
              top: 92,
              right: 20,
              backgroundColor: t.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: t.border,
              paddingVertical: 6,
              minWidth: 188,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: t.dark ? 0.5 : 0.16,
              shadowRadius: 24,
              elevation: 10,
            }}
          >
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => handle(item.onPress)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 13,
                    borderTopWidth: i > 0 ? 1 : 0,
                    borderTopColor: t.border,
                  }}
                >
                  <Icon size={19} color={t.accent} strokeWidth={2} />
                  <Text style={{ fontSize: 14.5, fontWeight: "600", color: t.text }}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
