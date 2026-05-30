import { View, TextInput } from "react-native";
import { Search } from "lucide-react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Хайх...",
  className = "",
}: SearchBarProps) {
  return (
    <View
      className={`flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5 ${className}`}
    >
      <Search size={18} color="#9CA3AF" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        className="flex-1 ml-2 text-sm text-gray-900 dark:text-white"
      />
    </View>
  );
}
