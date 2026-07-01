"use client";

import { useState } from "react";
import { Loader2, Phone, Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { confirmPassenger, removeDirectPassenger, reverseTransfer, unconfirmPassenger } from "@/actions/shift-exchange";
import { ReverseTransferDialog } from "./reverse-transfer-dialog";
import { UnconfirmDialog } from "./unconfirm-dialog";
import type { PassengerItem } from "@/types/shift-exchange";

export function PassengerList({
  busId,
  passengers,
  confirmedIds,
  transferredIn,
  transferredOut,
  onConfirmed,
  onUnconfirmed,
}: {
  busId: string;
  passengers: PassengerItem[];
  confirmedIds?: Set<string>;
  transferredIn?: PassengerItem[];
  transferredOut?: PassengerItem[];
  onConfirmed?: (assignmentId: string, name: string) => void;
  onUnconfirmed?: (assignmentId: string) => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [unconfirmDialog, setUnconfirmDialog] = useState<{
    passenger: PassengerItem;
    pending: boolean;
  } | null>(null);
  const [reverseDialog, setReverseDialog] = useState<{
    passenger: PassengerItem;
    pending: boolean;
  } | null>(null);
  const [query, setQuery] = useState("");

  function matchesQuery(p: PassengerItem): boolean {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const name = [p.lastName, p.firstName].filter(Boolean).join(" ").toLowerCase();
    return name.includes(q) || (p.phone ?? "").toLowerCase().includes(q);
  }

  const allActive = [...passengers, ...(transferredIn ?? [])];
  const confirmedCount = allActive.filter(
    (p) => p.isConfirmed || confirmedIds?.has(p.assignmentId),
  ).length;
  const totalCount = allActive.length;

  async function handleManualConfirm(p: PassengerItem) {
    if (pendingId) return;
    setPendingId(p.assignmentId);
    const name = [p.lastName, p.firstName].filter(Boolean).join(" ") || "—";
    const res = await confirmPassenger(p.btegId, busId);
    setPendingId(null);
    if (res.status === "confirmed" || res.status === "already") {
      onConfirmed?.(p.assignmentId, name);
    }
  }

  async function handleReverseConfirm() {
    if (!reverseDialog) return;
    setReverseDialog((d) => d && { ...d, pending: true });
    const { assignmentId, fromBusName } = reverseDialog.passenger;

    if (fromBusName === "Ээлжийн бус") {
      const res = await removeDirectPassenger(assignmentId);
      setReverseDialog(null);
      if (res.status === "removed") onUnconfirmed?.(assignmentId);
      return;
    }

    const res = await reverseTransfer(assignmentId);
    setReverseDialog(null);
    if (res.status === "reversed") onUnconfirmed?.(assignmentId);
  }

  async function handleUnconfirmConfirm() {
    if (!unconfirmDialog) return;
    setUnconfirmDialog((d) => d && { ...d, pending: true });
    const { btegId, assignmentId } = unconfirmDialog.passenger;
    const res = await unconfirmPassenger(btegId, busId);
    setUnconfirmDialog(null);
    if (res.status === "unconfirmed") {
      onUnconfirmed?.(assignmentId);
    }
  }

  function renderRow(p: PassengerItem, extraLabel?: string, readonly = false, isTransferred = false) {
    const isConfirmed = p.isConfirmed || (confirmedIds?.has(p.assignmentId) ?? false);
    const fullName = [p.lastName, p.firstName].filter(Boolean).join(" ") || "—";
    const isPending = pendingId === p.assignmentId;
    const isLeader = p.assignmentId.startsWith("leader-");

    return (
      <div
        key={p.assignmentId}
        className={cn(
          "flex items-center gap-3 px-4 py-3 border-l-2",
          readonly ? "border-l-muted-foreground/40" : isConfirmed ? "border-l-emerald-500" : "border-l-amber-400",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{fullName}</p>
          {extraLabel && (
            <p className="truncate text-xs font-medium text-blue-500">{extraLabel}</p>
          )}
          {p.departmentName && (
            <p className="truncate text-xs text-muted-foreground">{p.departmentName}</p>
          )}
          {p.positionName && (
            <p className="truncate text-xs text-muted-foreground">{p.positionName}</p>
          )}
          {p.phone && (
            <span className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">{p.phone}</span>
              <a
                href={`tel:${p.phone}`}
                className="shrink-0 text-muted-foreground/60 active:text-emerald-600"
                aria-label={`${p.phone} дугаарт залгах`}
              >
                <Phone className="h-3 w-3" />
              </a>
            </span>
          )}
        </div>

        {!readonly && (
          isConfirmed && !isLeader ? (
            <button
              type="button"
              onClick={() =>
                isTransferred
                  ? setReverseDialog({ passenger: p, pending: false })
                  : setUnconfirmDialog({ passenger: p, pending: false })
              }
              className="shrink-0 rounded-full px-3 py-1 text-xs font-medium bg-muted text-muted-foreground active:opacity-70"
            >
              Цуцлах
            </button>
          ) : !isConfirmed ? (
            <button
              type="button"
              disabled={!!pendingId}
              onClick={() => handleManualConfirm(p)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-opacity",
                pendingId
                  ? "text-muted-foreground"
                  : "bg-emerald-500 text-white active:opacity-70",
              )}
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Бүртгэх"}
            </button>
          ) : null
        )}
      </div>
    );
  }

  function SectionHeader({ label }: { label: string }) {
    return (
      <div className="px-4 py-1.5 bg-muted border-y border-border/50">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
    );
  }

  const filteredPassengers = passengers.filter(matchesQuery);
  const filteredTransferredIn = (transferredIn ?? []).filter(matchesQuery);
  const filteredTransferredOut = (transferredOut ?? []).filter(matchesQuery);

  const hasTransferredIn = (transferredIn?.length ?? 0) > 0;
  const hasTransferredOut = (transferredOut?.length ?? 0) > 0;
  const isEmpty = passengers.length === 0 && !hasTransferredIn && !hasTransferredOut;
  const isFilteredEmpty =
    filteredPassengers.length === 0 &&
    filteredTransferredIn.length === 0 &&
    filteredTransferredOut.length === 0;

  return (
    <>
      {unconfirmDialog && (
        <UnconfirmDialog
          passenger={unconfirmDialog.passenger}
          pending={unconfirmDialog.pending}
          onConfirm={handleUnconfirmConfirm}
          onCancel={() => setUnconfirmDialog(null)}
        />
      )}
      {reverseDialog && (
        <ReverseTransferDialog
          passenger={reverseDialog.passenger}
          pending={reverseDialog.pending}
          onConfirm={handleReverseConfirm}
          onCancel={() => setReverseDialog(null)}
        />
      )}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Зорчигчид</h2>
          <span className="text-xs text-muted-foreground">
            {confirmedCount} / {totalCount} бүртгэгдсэн
          </span>
        </div>

        <div className="sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Нэр эсвэл утасны дугаараар хайх..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground active:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        </div>

        <Card className="divide-y divide-border px-0 py-0 gap-0 overflow-hidden">
          {isEmpty ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Зорчигч байхгүй
            </div>
          ) : isFilteredEmpty ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Хайлтад тохирох зорчигч олдсонгүй
            </div>
          ) : (
            <>
              {filteredPassengers.map((p) => renderRow(p))}

              {filteredTransferredIn.length > 0 && (
                <>
                  <SectionHeader label="Нэмэлт зорчигчид" />
                  {filteredTransferredIn.map((p) => renderRow(p, p.fromBusName ?? undefined, false, true))}
                </>
              )}

              {filteredTransferredOut.length > 0 && (
                <>
                  <SectionHeader label="Гарсан зорчигчид" />
                  {filteredTransferredOut.map((p) => renderRow(p, p.toBusName ?? undefined, true))}
                </>
              )}
            </>
          )}
        </Card>
      </section>
    </>
  );
}
