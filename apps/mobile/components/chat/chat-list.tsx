import { View } from "react-native";
import { ChatListItem } from "@/components/chat/chat-list-item";
import type { BgsTheme } from "@/lib/theme";
import type { ChatThread } from "@/types";

interface ChatListProps {
  t: BgsTheme;
  threads: ChatThread[];
  onPressThread: (thread: ChatThread) => void;
}

export function ChatList({ t, threads, onPressThread }: ChatListProps) {
  return (
    <View>
      {threads.map((thread, i) => (
        <ChatListItem
          key={thread.id}
          t={t}
          thread={thread}
          hasBorder={i > 0}
          onPress={() => onPressThread(thread)}
        />
      ))}
    </View>
  );
}
