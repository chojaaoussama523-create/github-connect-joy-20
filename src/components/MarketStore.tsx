import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Minus, Plus, ShoppingCart, Truck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { createCodOrder, listProducts, FREE_SHIPPING_FROM_MAD, SHIPPING_MAD } from "@/lib/gm7-store.functions";
import { formatMad } from "@/lib/gm7-format";

export const productsQuery = queryOptions({ queryKey: ["market-products"], queryFn: () => listProducts() });

const field =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground outline-none focus:ring-2 focus:ring-ring";

export function MarketStore() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const create = useServerFn(createCodOrder);
  const navigate = useNavigate();

  const lines = products.filter((p) => cart[p.id]).map((p) => ({ p, qty: cart[p.id]! }));
  const subtotal = lines.reduce((s, l) => s + l.qty * l.p.priceMad, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM_MAD ? 0 : SHIPPING_MAD;

  function change(id: string, d: number) {
    setCart((c) => {
      const n = Math.max(0, Math.min(20, (c[id] ?? 0) + d));
      const next = { ...c };
      if (n === 0) delete next[id];
      else next[id] = n;
      return next;
    });
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await create({
        data: {
          customerName: String(f.get("name") ?? ""),
          phone: String(f.get("phone") ?? ""),
          city: String(f.get("city") ?? ""),
          address: String(f.get("address") ?? ""),
          notes: String(f.get("notes") ?? ""),
          items: lines.map((l) => ({ productId: l.p.id, qty: l.qty })),
        },
      });
      navigate({ to: "/invoice/$orderId", params: { orderId: res.id } });
    } catch {
      setError("تأكد من المعلومات (الهاتف مثلاً 06XXXXXXXX) وحاول مجدداً.");
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]" dir="rtl">
      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((p) => (
          <article key={p.id} className="rounded-xl border border-border bg-card/80 p-5 backdrop-blur">
            <h3 className="font-display text-lg font-black text-foreground">{p.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xl font-black text-primary">{formatMad(p.priceMad)}</span>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" onClick={() => change(p.id, -1)} aria-label="نقص">
                  <Minus />
                </Button>
                <span className="w-6 text-center font-bold">{cart[p.id] ?? 0}</span>
                <Button size="icon" onClick={() => change(p.id, 1)} aria-label="زيد">
                  <Plus />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <form onSubmit={submit} className="h-fit rounded-xl border border-border bg-card/90 p-5 backdrop-blur">
        <h3 className="flex items-center gap-2 font-display text-lg font-black">
          <ShoppingCart className="size-5" /> السلة — الدفع عند الاستلام
        </h3>
        {lines.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">زيد منتجات للسلة.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {lines.map((l) => (
              <li key={l.p.id} className="flex justify-between">
                <span>
                  {l.p.title} × {l.qty}
                </span>
                <span>{formatMad(l.qty * l.p.priceMad)}</span>
              </li>
            ))}
            <li className="flex justify-between text-muted-foreground">
              <span>التوصيل</span>
              <span>{shipping === 0 ? "مجاني" : formatMad(shipping)}</span>
            </li>
            <li className="flex justify-between border-t border-border pt-2 text-base font-black">
              <span>المجموع</span>
              <span className="text-primary">{formatMad(subtotal + shipping)}</span>
            </li>
          </ul>
        )}
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Truck className="size-3.5" /> توصيل مجاني فوق {formatMad(FREE_SHIPPING_FROM_MAD)}
        </p>
        <div className="mt-4 space-y-3">
          <input name="name" required minLength={2} maxLength={60} placeholder="الاسم الكامل" className={field} />
          <input name="phone" required inputMode="tel" placeholder="الهاتف 06XXXXXXXX" className={field} />
          <input name="city" required minLength={2} maxLength={40} placeholder="المدينة" className={field} />
          <input name="address" required minLength={5} maxLength={200} placeholder="العنوان" className={field} />
          <textarea name="notes" maxLength={300} placeholder="ملاحظات (اختياري)" className={`${field} h-20 py-2`} />
        </div>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        <Button type="submit" size="lg" className="mt-4 h-12 w-full" disabled={busy || lines.length === 0}>
          {busy ? "جارٍ الإرسال..." : "تأكيد الطلب (COD)"}
        </Button>
      </form>
    </div>
  );
}
