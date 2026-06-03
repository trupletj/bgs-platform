import { CalendarOff, Repeat, Plane, FileText } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Нэгтгэх хүсэлтийн төрлүүд (одоогоор placeholder — функц дараа нэмэгдэнэ).
const REQUEST_TYPES = [
  {
    key: "leave",
    title: "Чөлөөний хүсэлт",
    description: "Чөлөө, амралт авах хүсэлт",
    icon: CalendarOff,
  },
  {
    key: "shift-swap",
    title: "Ээлж солилцоо",
    description: "Ээлж солих хүсэлт",
    icon: Repeat,
  },
  {
    key: "travel",
    title: "Томилолт ба аялал",
    description: "Томилолт, автобусанд суух хүсэлт",
    icon: Plane,
  },
  {
    key: "general",
    title: "Бусад хүсэлт",
    description: "Ерөнхий өргөдөл, хүсэлт",
    icon: FileText,
  },
];

export default async function RequestsHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4 lg:p-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          BGS · Mini-app
        </p>
        <h1 className="text-2xl font-bold">Хүсэлтүүд</h1>
        <p className="text-sm text-muted-foreground">
          Төрөл бүрийн хүсэлтийг нэг дороос үүсгэж, төлөвийг хянана.
        </p>
        {!user ? (
          <p className="mt-2 text-sm text-destructive">
            Session тогтоогдоогүй байна. Аппаас дахин нээнэ үү.
          </p>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {REQUEST_TYPES.map((rt) => {
          const Icon = rt.icon;
          return (
            <Card
              key={rt.key}
              className="flex flex-col gap-3 p-4 opacity-90"
            >
              <div className="flex items-start justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <Badge variant="secondary">Удахгүй</Badge>
              </div>
              <div>
                <h2 className="text-sm font-semibold">{rt.title}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {rt.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
