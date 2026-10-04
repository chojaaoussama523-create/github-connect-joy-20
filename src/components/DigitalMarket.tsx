import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { createDigitalOrder, DIGITAL_CATEGORIES, listDigitalProducts, SUPPORT_WHATSAPP, type DigitalProduct } from "@/lib/gm7-digital.functions";
import { formatMad } from "@/lib/gm7-format";

export const digitalProductsQuery = queryOptions({ queryKey: ["digital-products"], queryFn: () => listDigitalProducts() });
const field = "h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground outline-none focus:ring-2 focus:ring-ring";

export function DigitalMarket() {
  const { data: products } = useSuspenseQuery(digitalProductsQuery);
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<DigitalProduct | null>(null);
  const [busy, setBusy] = useState(false);
  const create = useServerFn(createDigitalOrder);

  const shown = products.filter((p) => (cat === "all" || p.category === cat) && p.title.toLowerCase().includes(q.toLowerCase()));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sel) return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await create({ data: { productId: sel.id, playerId: String(f.get("player")), whatsapp: String(f.get("wa")).replace(/\s/g, "") } });
      const msg = encodeURIComponent(`طلب ${sel.title} — رقم الطلب ${res.id.slice(0, 8)} — ID: ${f.get("player")}`);
      toast.success("تم تسجيل طلبك بنجاح ✅", {
        description: "سنتواصل معك عبر واتساب لإتمام الشحن.",
        action: { label: "دعم واتساب", onClick: () => window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${msg}`, "_blank") },
      });
      setSel(null);
    } catch (err) {
      toast.error(err instanceof Error && err.message.includes("غير متوفر") ? err.message : "تأكد من رقم الواتساب (06XXXXXXXX) و الـ ID.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section dir="rtl" className="mb-12 space-y-5">
      <Toaster position="top-center" richColors />
      <h2 className="font-display text-2xl font-black text-foreground">المنتجات الرقمية — شحن وبطاقات</h2>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute right-3 top-3 size-5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن منتج..." className={`${field} pr-10`} />
        </label>
        <div className="flex flex-wrap gap-2">
          {([["all", "الكل"], ...Object.entries(DIGITAL_CATEGORIES)] as [string, string][]).map(([k, v]) => (
            <Button key={k} variant={cat === k ? "default" : "outline"} onClick={() => setCat(k)}>{v}</Button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((p) => (
          <article key={p.id} className="flex flex-col rounded-xl border border-border bg-card/80 p-4 backdrop-blur">
            {p.image_url ? <img src={p.image_url} alt={p.title} loading="lazy" className="mb-3 aspect-video w-full rounded-lg object-cover" /> : null}
            <span className="text-xs text-primary">{DIGITAL_CATEGORIES[p.category as keyof typeof DIGITAL_CATEGORIES] ?? p.category}</span>
            <h3 className="font-display text-lg font-black text-foreground">{p.title}</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{p.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xl font-black text-primary">{formatMad(p.price)}</span>
              <Button disabled={p.stock_status !== "in_stock"} onClick={() => setSel(p)}>
                {p.stock_status === "in_stock" ? "اشتري الآن" : "نفد"}
              </Button>
            </div>
          </article>
        ))}
        {shown.length === 0 ? <p className="text-muted-foreground">لا توجد منتجات.</p> : null}
      </div>
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>{sel?.title} — {sel ? formatMad(sel.price) : ""}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <input name="player" required minLength={2} maxLength={64} placeholder="Game / Player ID" className={field} dir="ltr" />
            <input name="wa" required inputMode="tel" placeholder="WhatsApp 06XXXXXXXX" className={field} dir="ltr" />
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "..." : "تأكيد الطلب"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
