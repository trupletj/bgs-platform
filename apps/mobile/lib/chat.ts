import type { ChatThread } from "@/types";

/**
 * Чатын жагсаалтаас нийт уншаагүй мессежийн тоо.
 * Official (системийн) болон чимээгүй болгосон чатыг тооцохгүй.
 * Tab badge болон бусад газар нэг эх сурвалжаас ашиглана.
 */
export function unreadTotal(threads: ChatThread[] | undefined): number {
  return (threads ?? [])
    .filter((th) => !th.isOfficial && !th.muted)
    .reduce((sum, th) => sum + (th.unread ?? 0), 0);
}
