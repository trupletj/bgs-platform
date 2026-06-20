"use client";

import { useState, type ReactNode } from "react";
import { Clock, RefreshCcw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS: { label: string; icon: LucideIcon }[] = [
  { label: "Цаг бүртгэл", icon: Clock },
  { label: "Ээлж солилцоо", icon: RefreshCcw },
];

export function MiniAppTabs({
  attendanceSlot,
  shiftExchangeSlot,
}: {
  attendanceSlot: ReactNode;
  shiftExchangeSlot: ReactNode;
}) {
  const [tab, setTab] = useState<0 | 1>(0);

  return (
    <>
      {/* Tab 1 — Цаг бүртгэл (live clock хадгалахын тулд mount-д үлдээж hidden-ээр нуух) */}
      <div
        className={cn(
          "mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24",
          tab !== 0 && "hidden",
        )}
      >
        {attendanceSlot}
      </div>

      {/* Tab 2 — Ээлж солилцоо */}
      <div
        className={cn(
          "mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24",
          tab !== 1 && "hidden",
        )}
      >
        {shiftExchangeSlot}
      </div>

      {/* Доод native маягийн tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-md pb-[env(safe-area-inset-bottom)]">
          {TABS.map((t, i) => {
            const active = tab === i;
            const Icon = t.icon;
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => setTab(i as 0 | 1)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                <span className="text-[11px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
