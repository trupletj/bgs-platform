import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScanLine } from "lucide-react-native";
import { S } from "@/constants/strings";

export default function ScanScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-lg font-bold text-white mb-8">{S.scan.title}</Text>

        {/* Viewfinder */}
        <View className="w-64 h-64 relative items-center justify-center">
          {/* Corner markers */}
          <View className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
          <View className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
          <View className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
          <View className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl" />

          <ScanLine size={48} color="#2563EB" />
        </View>

        <Text className="text-sm text-gray-400 mt-8 text-center">
          {S.scan.instruction}
        </Text>
      </View>
    </SafeAreaView>
  );
}
