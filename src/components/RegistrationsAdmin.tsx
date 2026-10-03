import { useServerFn } from "@tanstack/react-start";
import { Ban, Check, Clock, Copy, Download, RefreshCw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  adminDeleteTournamentRegistration,
  adminListTournamentRegistrations,
  adminSetTournamentRegStatus,
  type TRegRow,
  type TRegStatus,
} from "@/lib/gm7-registrations.functions";

const LABELS: Record<TRegStatus, string> = {
  pending: "قيد المراجعة",
  accepted: "مقبول",
  waitlist: "قائمة انتظار",
  rejected: "مرفوض",
  disqualified: "مستبعد",
};

export function RegistrationsAdmin({ access }: { access: string }) {
  const list = useServerFn(adminListTournamentRegistrations);
  const setStatusFn = useServerFn(adminSetTournamentRegStatus);
  const deleteFn = useServerFn(adminDeleteTournamentRegistration);
  const [rows, setRows] = useState<TRegRow[]>([]);
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

  async function setStatus(id: string, status: TRegStatus) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    try {
      await setStatusFn({ data: { access, id, status } });
    } catch {
      setError("تعذر تحديث الحالة.");
      void load();
    }
  }

  async function remove(id: string) {
    setRows((r) => r.filter((x) => x.id !== id));
    try {
      await deleteFn({ data: { access, id } });
    } catch {
      setError("تعذر حذف التسجيل.");
      void load();
    }
  }

  function exportCsv() {
    const out = [["Team", "Captain", "Phone", "City", "Platform ID", "Mode", "Players", "Status"]];
    rows.forEach((r) =>
      out.push([
        r.teamName,
        r.captainName,
        r.phone,
        r.city,
        r.platformId,
        `${r.mode}v${r.mode}`,
        r.players.map((p) => `${p.name}(${p.ign})`).join(" | "),
        LABELS[r.status],
      ]),
    );
    const csv = "﻿" + out.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "gm7-registrations.csv";
    a.click();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {rows.length} تسجيل · {rows.filter((r) => r.status === "accepted").length} مقبول ·{" "}
          {rows.filter((r) => r.status === "disqualified").length} مستبعد
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
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/80 p-4 text-sm">
          <div className="min-w-0">
            <p className="font-bold text-foreground">
              {r.teamName || r.captainName} <span className="text-xs text-muted-foreground">· {r.captainName} · {r.city}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {r.mode}v{r.mode} · IGN: {r.platformId} · {r.phone}
              {r.discord ? ` · ${r.discord}` : ""}
            </p>
            {r.players.length ? (
              <p className="text-xs text-muted-foreground">التشكيلة: {r.players.map((p) => `${p.name} (${p.ign})`).join("، ")}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-primary">{LABELS[r.status]}</span>
            <Button size="sm" onClick={() => void setStatus(r.id, "accepted")} aria-label="قبول"><Check aria-hidden="true" /></Button>
            <Button size="sm" variant="outline" onClick={() => void setStatus(r.id, "waitlist")} aria-label="قائمة انتظار"><Clock aria-hidden="true" /></Button>
            <Button size="sm" variant="outline" onClick={() => void setStatus(r.id, "disqualified")} aria-label="استبعاد"><Ban aria-hidden="true" /></Button>
            <Button size="sm" variant="destructive" onClick={() => void setStatus(r.id, "rejected")} aria-label="رفض"><X aria-hidden="true" /></Button>
            <Button size="sm" variant="destructive" onClick={() => void remove(r.id)} aria-label="حذف نهائي"><Trash2 aria-hidden="true" /></Button>
            <Button size="sm" variant="ghost" onClick={() => void navigator.clipboard.writeText(r.phone)} aria-label="نسخ الهاتف"><Copy aria-hidden="true" /></Button>
          </div>
        </div>
      ))}
    </div>
  );
}
