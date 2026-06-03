import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  SCENARIO_KEYS,
  SCENARIO_LABELS,
  type ScenarioKey,
} from "@/lib/dummy-attendance";

export function ScenarioSwitcher({ current }: { current: ScenarioKey }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <Card className="gap-2 border-dashed px-4 py-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Scenario (dev only)
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SCENARIO_KEYS.map((key) => {
          const active = key === current;
          return (
            <Link
              key={key}
              href={{ pathname: "/", query: { scenario: key } }}
              prefetch={false}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {SCENARIO_LABELS[key]}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
