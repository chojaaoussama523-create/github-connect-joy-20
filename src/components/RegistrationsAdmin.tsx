import { useServerFn } from "@tanstack/react-start";
import { Check, Clock, Copy, Download, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { adminListRegistrations, adminSetStatus, type RegRow, type RegStatus } from "@/lib/gm7-registrations.functions";
import { GAMES } from "@/lib/gm7-tournaments";

const LABELS: Record<RegStatus, string> = {
  new: "جديد",
  "checked-in": "أكد الحضور",
  accepted: "مقبول",
  waitlist: "قائمة انتظار",
  rejected: "مرفوض",
};

const gameName = (id: string) => GAMES.find((g) => g.id === id)?.name ?? id;

export function RegistrationsAdmin({ access }: { access: string }) {
  const list = useServerFn(adminListRegistrations);
  const setStatusFn = useServerFn(adminSetStatus);
  const [rows, setRows] = useState<RegRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await list({ data: { access } }));
    } catch {
      setError("تعذر تحميل التسجيلات.");
    } finally {
      setLoading(false);
    }
  }, [list, access]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(code: string, status: RegStatus) {
    setRows((r) => r.map((x) => (x.code === code ? { ...x, status } : x)));
    try {
      await setStatusFn({ data: { access, code, status } });
    } catch {
      setError("تعذر تحديث الحالة.");
      void load();
    }
  }

  function exportCsv() {
    const out = [["ID", "Team", "Captain", "WhatsApp", "City", "Platform", "Game", "Mode", "Status"]];
    rows.forEach((r) =>
      out.push([r.code, r.team, r.captain, r.whatsapp, r.city, r.platform, gameName(r.gameId), `${r.mode}v${r.mode}`, LABELS[r.status]]),
    );
    const csv = "\uFEFF" + out.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "gm7-registrations.csv";
    a.click();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {rows.length} تسجيل · {rows.filter((r) => r.status === "checked-in").length} أكدو الحضور
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw aria-hidden="true" /> تحديث</Button>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={!rows.length}><Download aria-hidden="true" /> تصدير</Button>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">جارٍ التحميل...</p> : null}
      {!loading && !rows.length ? (
        <p className="rounded-xl border border-border bg-card/80 p-6 text-center text-sm text-muted-foreground">ما كاين حتى تسجيل دابا.</p>
      ) : null}
      {rows.map((r) => (
        <div key={r.code} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/80 p-4 text-sm">
          <div className="min-w-0">
            <p className="font-bold text-foreground">{r.team} <span className="text-xs text-muted-foreground">· {r.captain} · {r.city}</span></p>
            <p className="text-xs text-muted-foreground">{gameName(r.gameId)} · {r.platform} · {r.mode}v{r.mode} · {r.platformId} · {r.code}</p>
            {r.roster.length ? <p className="text-xs text-muted-foreground">التشكيلة: {r.roster.join("، ")}{r.sub ? ` · احتياطي: ${r.sub}` : ""}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-primary">{LABELS[r.status]}</span>
            <Button size="sm" onClick={() => void setStatus(r.code, "accepted")} aria-label="قبول"><Check aria-hidden="true" /></Button>
            <Button size="sm" variant="outline" onClick={() => void setStatus(r.code, "waitlist")} aria-label="قائمة انتظار"><Clock aria-hidden="true" /></Button>
            <Button size="sm" variant="destructive" onClick={() => void setStatus(r.code, "rejected")} aria-label="رفض"><X aria-hidden="true" /></Button>
            <Button size="sm" variant="ghost" onClick={() => void navigator.clipboard.writeText(r.whatsapp)} aria-label="نسخ واتساب"><Copy aria-hidden="true" /></Button>
          </div>
        </div>
      ))}
    </div>
  );
}
