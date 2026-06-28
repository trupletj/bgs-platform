import { Tabs } from "expo-router";
import { CustomTabBar } from "@/components/navigation/custom-tab-bar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="contacts" />
      <Tabs.Screen name="mini-apps" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
