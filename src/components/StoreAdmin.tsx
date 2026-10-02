import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  adminAddMedia,
  adminDeleteTournament,
  adminListOrders,
  adminSaveTournament,
  adminSetOrderStatus,
  adminUpdateMedia,
  type OrderStatus,
} from "@/lib/gm7-store.functions";
import { formatMad, ORDER_STATUS_LABELS } from "@/lib/gm7-format";
import { GAMES, PLATFORMS } from "@/lib/gm7-tournaments";
import { tournamentsQuery, T_STATUS } from "@/components/ActiveTournaments";
import { mediaQuery } from "@/components/SnnseiMedia";

const field = "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground";

export function OrdersAdmin({ access }: { access: string }) {
  const list = useServerFn(adminListOrders);
  const setStatus = useServerFn(adminSetOrderStatus);
  const { data, refetch, isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: () => list({ data: { access } }) });
  const orders = data ?? [];
  const revenue = orders.filter((o) => o.status === "paid" || o.status === "delivered").reduce((s, o) => s + o.totalMad, 0);

  async function update(id: string, status: OrderStatus) {
    await setStatus({ data: { access, id, status } });
    refetch();
  }

  return (
    <div dir="rtl" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="الطلبات" value={String(orders.length)} />
        <Stat label="قيد الانتظار" value={String(orders.filter((o) => o.status === "pending").length)} />
        <Stat label="المبيعات المقبوضة" value={formatMad(revenue)} />
      </div>
      <Button variant="outline" onClick={() => exportCsv(orders)}>تصدير CSV / Excel</Button>
      {isLoading ? <p className="text-muted-foreground">...</p> : null}
      <div className="overflow-x-auto rounded-xl border border-border bg-card/80">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border text-right">
              <th className="p-3">رقم</th><th className="p-3">الزبون</th><th className="p-3">المدينة</th>
              <th className="p-3">المجموع</th><th className="p-3">الحالة</th><th className="p-3">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="p-3 font-mono-code text-xs">
                  <Link to="/invoice/$orderId" params={{ orderId: o.id }} className="text-primary underline" target="_blank">{o.orderNumber}</Link>
                </td>
                <td className="p-3">{o.customerName}<br /><span className="text-xs text-muted-foreground" dir="ltr">{o.phone}</span></td>
                <td className="p-3">{o.city}</td>
                <td className="p-3 font-bold">{formatMad(o.totalMad)}</td>
                <td className="p-3">
                  <select value={o.status} onChange={(e) => update(o.id, e.target.value as OrderStatus)} className={field}>
                    {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td className="p-3">
                  <div className="flex gap-1">{o.status === "pending" ? <Button size="sm" onClick={() => update(o.id, "confirmed")}>تأكيد</Button> : null}<a className="rounded-md border border-border px-2 py-1 text-xs" target="_blank" rel="noreferrer" href={waLink(o.phone, `مرحبا ${o.customerName}، نؤكد طلبك ${o.orderNumber} بمبلغ ${formatMad(o.totalMad)} (الدفع عند الاستلام).`)}>واتساب</a></div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && !isLoading ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">لا توجد طلبات بعد.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/80 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black text-foreground">{value}</p>
    </div>
  );
}

export function TournamentsAdmin({ access }: { access: string }) {
  const qc = useQueryClient();
  const { data } = useQuery(tournamentsQuery);
  const save = useServerFn(adminSaveTournament);
  const del = useServerFn(adminDeleteTournament);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const game = GAMES.find((g) => g.id === f.get("game")) ?? GAMES[0]!;
    setBusy(true);
    await save({
      data: {
        access,
        title: String(f.get("title")),
        gameId: game.id,
        gameName: game.name,
        platform: f.get("platform") as "PC",
        mode: Number(f.get("mode")),
        format: f.get("format") as "knockout",
        bracketSize: Number(f.get("size")),
        prizeMad: Number(f.get("prize")),
        status: f.get("status") as "open",
        startsAt: String(f.get("date") || "") || null,
        teams: [],
      },
    });
    setBusy(false);
    form.reset();
    qc.invalidateQueries({ queryKey: tournamentsQuery.queryKey });
  }

  async function setStatus(t: NonNullable<typeof data>[number], status: "open" | "live" | "finished") {
    await save({ data: { access, ...t, platform: t.platform as "PC", format: t.format as "knockout", status } });
    qc.invalidateQueries({ queryKey: tournamentsQuery.queryKey });
  }

  return (
    <div dir="rtl" className="space-y-4">
      <form onSubmit={submit} className="grid gap-2 rounded-xl border border-border bg-card/80 p-4 sm:grid-cols-4">
        <input name="title" required minLength={2} placeholder="اسم البطولة" className={`${field} sm:col-span-2`} />
        <select name="game" className={field}>{GAMES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
        <select name="platform" className={field}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select>
        <select name="mode" className={field}>{[1, 2, 3, 4, 5].map((m) => <option key={m} value={m}>{m}v{m}</option>)}</select>
        <select name="format" className={field}><option value="knockout">إقصائي</option><option value="groups">مجموعات</option></select>
        <select name="size" defaultValue="8" className={field}>{[2, 4, 8, 16, 32].map((s) => <option key={s}>{s}</option>)}</select>
        <input name="prize" type="number" min={0} defaultValue={1000} placeholder="الجائزة (درهم)" className={field} />
        <input name="date" type="date" className={field} />
        <select name="status" className={field}>{Object.entries(T_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <Button type="submit" disabled={busy} className="sm:col-span-2">إضافة بطولة نشطة</Button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-border bg-card/80">
        <table className="w-full text-sm">
          <tbody>
            {(data ?? []).map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="p-3 font-bold">{t.title}</td>
                <td className="p-3">{t.gameName} · {t.platform} · {t.mode}v{t.mode}</td>
                <td className="p-3">{formatMad(t.prizeMad)}</td>
                <td className="p-3">
                  <select value={t.status} onChange={(e) => setStatus(t, e.target.value as "open")} className={field}>
                    {Object.entries(T_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td className="p-3">
                  <Button size="sm" variant="outline" onClick={async () => { await del({ data: { access, id: t.id } }); qc.invalidateQueries({ queryKey: tournamentsQuery.queryKey }); }}>حذف</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MediaAdmin({ access }: { access: string }) {
  const qc = useQueryClient();
  const { data } = useQuery(mediaQuery);
  const add = useServerFn(adminAddMedia);
  const upd = useServerFn(adminUpdateMedia);
  const refresh = () => qc.invalidateQueries({ queryKey: mediaQuery.queryKey });

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    await add({
      data: {
        access,
        platform: f.get("platform") as "kick",
        kind: f.get("kind") as "short",
        title: String(f.get("title")),
        url: String(f.get("url")),
      },
    });
    form.reset();
    refresh();
  }

  return (
    <div dir="rtl" className="space-y-4">
      <form onSubmit={submit} className="grid gap-2 rounded-xl border border-border bg-card/80 p-4 sm:grid-cols-5">
        <select name="platform" className={field}><option value="kick">KICK</option><option value="youtube">YOUTUBE</option><option value="tiktok">TIKTOK</option><option value="instagram">INSTAGRAM</option></select>
        <select name="kind" className={field}><option value="short">Short 9:16</option><option value="video">فيديو</option><option value="live">بث مباشر</option></select>
        <input name="title" required minLength={2} placeholder="العنوان" className={field} />
        <input name="url" type="url" required placeholder="الرابط" className={field} />
        <Button type="submit">إضافة</Button>
      </form>
      <ul className="space-y-2">
        {(data ?? []).map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/80 p-3 text-sm">
            <span className="font-bold uppercase text-primary">{m.platform}</span>
            <span className="text-muted-foreground">{m.kind}</span>
            <span className="flex-1 truncate">{m.title}</span>
            {m.kind === "live" ? (
              <Button size="sm" variant={m.isLive ? "destructive" : "outline"} onClick={async () => { await upd({ data: { access, id: m.id, isLive: !m.isLive } }); refresh(); }}>
                {m.isLive ? "● LIVE — إيقاف" : "تشغيل LIVE"}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={async () => { await upd({ data: { access, id: m.id, remove: true } }); refresh(); }}>حذف</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function waLink(phone: string, text: string) {
  let p = phone.replace(/\D/g, "");
  if (p.startsWith("0")) p = "212" + p.slice(1);
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}

function exportCsv(orders: { orderNumber: string; customerName: string; phone: string; city: string; totalMad: number; status: string }[]) {
  const rows = [["رقم", "الزبون", "الهاتف", "المدينة", "المجموع MAD", "الحالة"], ...orders.map((o) => [o.orderNumber, o.customerName, o.phone, o.city, String(o.totalMad), o.status])];
  const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `gm7-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
