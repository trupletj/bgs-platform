import type { WorkerProfileLite } from "@/types/attendance";

export function AttendanceHeader({ worker }: { worker: WorkerProfileLite }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
        Ирц
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
        {worker.fullName}
      </h1>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {worker.position} · {worker.shiftGroup}
      </p>
    </div>
  );
}
