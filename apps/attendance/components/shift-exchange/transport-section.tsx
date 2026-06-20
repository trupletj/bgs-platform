import { Bus } from "lucide-react";
import { Card } from "@/components/ui/card";

export function TransportSection() {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-foreground">Унаа</h2>

      <Card className="items-center gap-3 px-5 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Bus className="h-6 w-6 text-muted-foreground" />
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
