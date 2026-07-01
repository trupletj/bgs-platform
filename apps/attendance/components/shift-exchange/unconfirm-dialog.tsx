"use client";

import { Loader2, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PassengerItem } from "@/types/shift-exchange";

interface Props {
  passenger: PassengerItem;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnconfirmDialog({ passenger, pending, onConfirm, onCancel }: Props) {
  const fullName =
    [passenger.lastName, passenger.firstName].filter(Boolean).join(" ") || "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <UserMinus className="h-6 w-6 text-red-600" />
          </span>
          <div className="space-y-0.5">
            <p className="text-lg font-bold text-foreground">{fullName}</p>
            {passenger.departmentName && (
              <p className="text-sm text-muted-foreground">{passenger.departmentName}</p>
            )}
            {passenger.positionName && (
              <p className="text-sm text-muted-foreground">{passenger.positionName}</p>
            )}
          </div>
          <p className="text-base font-semibold text-foreground">Бүртгэл цуцлах уу?</p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="flex-1 rounded-xl border py-2.5 text-sm font-semibold text-foreground"
          >
            Үгүй
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white",
              pending && "opacity-60",
            )}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Тийм"}
          </button>
        </div>
      </div>
    </div>
  );
}
