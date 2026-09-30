import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lock, LogOut, ShoppingBag, Swords, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import dashboardBg from "@/assets/dashboard-bg.jpg.asset.json";
import dashboardLogo from "@/assets/gm7-dashboard-logo.png.asset.json";
import { RegistrationsAdmin } from "@/components/RegistrationsAdmin";
import { TournamentEngine } from "@/components/TournamentEngine";
import { Button } from "@/components/ui/button";
import { verifyAdminAccess } from "@/lib/gm7-admin.functions";
import {
  MARKET_ITEMS,
  STATUS_LABELS,
  TOURNAMENT_ITEMS,
  type MarketItem,
  type TournamentItem,
} from "@/lib/gm7-content";

export const Route = createFileRoute("/gm7-dashboard")({
  head: () => ({
    meta: [
      { title: "GM7 Dashboard — لوحة القيادة" },
      { name: "description", content: "لوحة إدارة GM7 الخاصة." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "GM7 Dashboard" },
      { property: "og:description", content: "لوحة إدارة خاصة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

const SESSION_KEY = "gm7-admin-session";

function DashboardPage() {
  const [access, setAccess] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    setAccess(saved && saved !== "1" ? saved : null);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <img src={dashboardBg.url} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" aria-hidden="true" />
      <div className="relative">
        {access ? (
          <Console
            access={access}
            onLogout={() => {
              sessionStorage.removeItem(SESSION_KEY);
              setAccess(null);
            }}
          />
        ) : (
          <Gate
            onSuccess={(code) => {
              sessionStorage.setItem(SESSION_KEY, code);
              setAccess(code);
            }}
          />
        )}
      </div>
    </div>
  );
}

function Gate({ onSuccess }: { onSuccess: (code: string) => void }) {
  const verify = useServerFn(verifyAdminAccess);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await verify({ data: { code } });
      if (result.ok) {
        onSuccess(code.trim());
      } else if (result.reason === "locked") {
        setError(`محاولات كثيرة. أعد المحاولة بعد ${Math.ceil((result.retryAfterSeconds ?? 600) / 60)} دقيقة.`);
      } else if (result.reason === "unconfigured") {
        setError("لم يتم إعداد كود الدخول بعد.");
      } else {
        setError("كود الدخول غير صحيح.");
      }
    } catch {
      setError("تعذر التحقق حالياً، حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card/80 p-8 text-center backdrop-blur">
        <img src={dashboardLogo.url} alt="GM7 Dashboard" className="mx-auto h-40 object-contain" />
        <h1 className="mt-4 font-display text-2xl font-black text-foreground">GM7 COMMAND CENTER</h1>
        <p className="mt-2 text-sm text-muted-foreground">منطقة إدارية خاصة</p>
        <label htmlFor="code" className="sr-only">كود الدخول</label>
        <input
          id="code"
          type="password"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="كود الدخول"
          maxLength={64}
          className="mt-6 h-12 w-full rounded-lg border border-input bg-background px-4 text-center text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        {error ? <p className="mt-3 text-sm text-destructive" role="alert">{error}</p> : null}
        <Button type="submit" size="lg" className="mt-5 h-12 w-full" disabled={busy || !code.trim()}>
          <Lock aria-hidden="true" /> {busy ? "جارٍ التحقق..." : "دخول"}
        </Button>
      </form>
    </div>
  );
}

function Console({ access, onLogout }: { access: string; onLogout: () => void }) {
  const [tab, setTab] = useState<"market" | "tournaments" | "registrations">("tournaments");
  const items: (MarketItem | TournamentItem)[] = tab === "market" ? MARKET_ITEMS : TOURNAMENT_ITEMS;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src={dashboardLogo.url} alt="" className="h-14 w-14 shrink-0 object-contain" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-black text-foreground">GM7 DASHBOARD</h1>
            <p className="text-xs text-muted-foreground">مركز القيادة</p>
          </div>
        </div>
        <Button variant="outline" onClick={onLogout}>
          <LogOut aria-hidden="true" /> خروج
        </Button>
      </header>

      <div className="mt-8 flex gap-2" role="tablist">
        <Button variant={tab === "tournaments" ? "default" : "outline"} onClick={() => setTab("tournaments")} role="tab" aria-selected={tab === "tournaments"}>
          <Swords aria-hidden="true" /> البطولات
        </Button>
        <Button variant={tab === "registrations" ? "default" : "outline"} onClick={() => setTab("registrations")} role="tab" aria-selected={tab === "registrations"}>
          <Users aria-hidden="true" /> التسجيلات
        </Button>
        <Button variant={tab === "market" ? "default" : "outline"} onClick={() => setTab("market")} role="tab" aria-selected={tab === "market"}>
          <ShoppingBag aria-hidden="true" /> المتجر
        </Button>
      </div>

      {tab === "registrations" ? (
        <div className="mt-6"><RegistrationsAdmin access={access} /></div>
      ) : tab === "tournaments" ? (
        <div className="mt-6"><TournamentEngine /></div>
      ) : (
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-border bg-card/80 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-primary">{item.tag}</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">{STATUS_LABELS[item.status]}</span>
            </div>
            <h2 className="mt-3 font-display text-lg font-black text-foreground">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
          </article>
        ))}
      </div>
      )}
    </div>
  );
}
