import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BusStop } from "@/types/shift-exchange";

export function RouteStopsList({ stops }: { stops: BusStop[] }) {
  if (!stops.length) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-foreground">Маршрут</h2>
      <div className="flex flex-col">
        {stops.map((stop, idx) => {
          const isLast = idx === stops.length - 1;
          return (
            <div key={stop.order} className="flex gap-3">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    isLast
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                {!isLast && (
                  <div className="w-0.5 flex-1 bg-border my-0.5" />
                )}
              </div>

              {/* Content */}
              <div className={cn("flex flex-col gap-0.5 pb-3", isLast && "pb-0")}>
                <p className="text-sm font-medium text-foreground leading-none pt-1">
                  {stop.directionName}
                </p>
                {stop.zamTsag != null && (
                  <p className="text-xs text-muted-foreground">
                    {stop.zamTsag} минут
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
