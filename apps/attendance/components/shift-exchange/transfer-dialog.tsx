"use client";

import { Loader2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  btegId: string;
  passengerName: string | null;
  departmentName: string | null;
  positionName: string | null;
  currentBusName: string | null;
  busName: string;
  pending: boolean;
  onAdd: () => void;
  onCancel: () => void;
}

export function TransferDialog({ btegId: _btegId, passengerName, departmentName, positionName, currentBusName, busName, pending, onAdd, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <UserPlus className="h-6 w-6 text-amber-600" />
          </span>
          <div className="space-y-0.5">
            {passengerName && (
              <p className="text-lg font-bold text-foreground">{passengerName}</p>
            )}
            {departmentName && (
              <p className="text-sm text-muted-foreground">{departmentName}</p>
            )}
            {positionName && (
              <p className="text-sm text-muted-foreground">{positionName}</p>
            )}
            {currentBusName ? (
              <p className="pt-0.5 text-sm font-medium text-amber-600">
                {currentBusName} автобусны зорчигч
              </p>
            ) : (
              <p className="pt-0.5 text-sm font-medium text-muted-foreground">
                Ээлжийн бус
              </p>
            )}
            <p className={passengerName ? "pt-1 text-sm text-muted-foreground" : "text-base font-bold text-foreground"}>
              {passengerName ? "энэ автобусанд бүртгэлгүй байна" : "Энэ автобусанд бүртгэлгүй"}
            </p>
            <p className="text-sm text-muted-foreground">
              {busName} автобусны жагсаалтад нэмэх үү?
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="flex-1 rounded-xl border py-2.5 text-sm font-semibold text-foreground"
          >
            Цуцлах
          </button>
          <button
            type="button"
            onClick={onAdd}
            disabled={pending}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground",
              pending && "opacity-60",
            )}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Нэмэх"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
