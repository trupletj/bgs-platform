"use client";

import { Loader2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PassengerItem } from "@/types/shift-exchange";

interface Props {
  passenger: PassengerItem;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ReverseTransferDialog({ passenger, pending, onConfirm, onCancel }: Props) {
  const fullName = [passenger.lastName, passenger.firstName].filter(Boolean).join(" ") || "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Undo2 className="h-6 w-6 text-amber-600" />
          </span>
          <div className="space-y-0.5">
            <p className="text-lg font-bold text-foreground">{fullName}</p>
            {passenger.fromBusName && (
              <p className="text-sm text-muted-foreground">{passenger.fromBusName}</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">Шилжилтийг буцаах уу?</p>
            <p className="text-sm text-muted-foreground">Зорчигч анхны автобус руугаа буцна</p>
          </div>
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
              "flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white",
              pending && "opacity-60",
            )}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Буцаах"}
          </button>
        </div>
      </div>
    </div>
  );
}
