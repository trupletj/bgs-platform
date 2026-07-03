import { View, TextInput, type ViewStyle } from "react-native";
import { Search } from "lucide-react-native";
import { useTheme } from "@/hooks/use-theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Хайх...",
  style,
}: SearchBarProps) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: t.card,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
        },
        style,
      ]}
    >
      <Search size={18} color={t.faint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.faint}
        style={{ flex: 1, marginLeft: 8, fontSize: 14, color: t.text }}
      />
    </View>
  );
}
