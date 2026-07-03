import { Platform } from "react-native";
import {
  NativeTabs,
  Icon,
  Label,
  Badge,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { unreadTotal } from "@/lib/chat";
import { S } from "@/constants/strings";
import { BGS_ACCENT } from "@/lib/theme";

export default function TabLayout() {
  const { data: threads } = useQuery({
    queryKey: queryKeys.chat.threads,
    queryFn: api.getChatThreads,
  });
  const unread = unreadTotal(threads);

  return (
    <NativeTabs tintColor={BGS_ACCENT}>
      <NativeTabs.Trigger name="(home)">
        <Label>{S.tabs.chat}</Label>
        {Platform.select({
          ios: <Icon sf={{ default: "message", selected: "message.fill" }} />,
          default: <Icon src={<VectorIcon family={MaterialIcons} name="chat" />} />,
        })}
        {unread > 0 && <Badge>{unread > 99 ? "99+" : String(unread)}</Badge>}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="contacts">
        <Label>{S.tabs.contacts}</Label>
        {Platform.select({
          ios: <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />,
          default: <Icon src={<VectorIcon family={MaterialIcons} name="group" />} />,
        })}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mini-apps">
        <Label>{S.tabs.miniApps}</Label>
        {Platform.select({
          ios: (
            <Icon
              sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }}
            />
          ),
          default: <Icon src={<VectorIcon family={MaterialIcons} name="grid-view" />} />,
        })}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>{S.tabs.profile}</Label>
        {Platform.select({
          ios: <Icon sf={{ default: "person", selected: "person.fill" }} />,
          default: <Icon src={<VectorIcon family={MaterialIcons} name="person" />} />,
        })}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
