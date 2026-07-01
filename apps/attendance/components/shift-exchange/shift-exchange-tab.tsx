import { Card } from "@/components/ui/card";
import { PassengerView } from "./passenger-view";
import { LeaderView } from "./leader-view";
import type { LedBus, MyBusInfo } from "@/types/shift-exchange";

interface Props {
  isLeader: boolean;
  busInfos: MyBusInfo[];
  ledBuses: LedBus[];
}

export function ShiftExchangeTab({ isLeader, busInfos, ledBuses }: Props) {

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

      {isLeader && ledBuses.length > 0 ? (
        <LeaderView buses={ledBuses} />
      ) : busInfos.length > 0 ? (
        <PassengerView data={busInfos} />
      ) : (
        <EmptyTransport />
      )}
    </>
  );
}

function EmptyTransport() {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-foreground">Унаа</h2>
      <Card className="items-center gap-3 px-5 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <img src="/bus-icon.png" alt="bus" className="h-8 w-8 object-contain opacity-40" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            Унаа бүртгэгдээгүй байна
          </p>
          <p className="text-xs text-muted-foreground">
            Таны ээлжийн унааны мэдээлэл энд харагдана.
          </p>
        </div>
      </Card>
    </section>
  );
}
