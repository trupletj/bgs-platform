import { TransportSection } from "@/components/shift-exchange/transport-section";

export function ShiftExchangeTab() {
  return (
    <>
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
          Ирц
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          Ээлж солилцоо
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Ээлжийн унаа болон солилцооны мэдээлэл
        </p>
      </div>

      <TransportSection />
    </>
  );
}
