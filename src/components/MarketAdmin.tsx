import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  adminDeleteDigitalProduct, adminListDigitalOrders, adminSaveDigitalProduct, adminSetDigitalOrderStatus,
  DIGITAL_CATEGORIES, listDigitalProducts, type DigitalOrder, type DigitalProduct,
} from "@/lib/gm7-digital.functions";
import { formatMad } from "@/lib/gm7-format";

const field = "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground";
const STATUS = { pending: "معلق", completed: "مكتمل", cancelled: "ملغى" } as const;

export function MarketAdmin({ access }: { access: string }) {
  const listO = useServerFn(adminListDigitalOrders);
  const setStatus = useServerFn(adminSetDigitalOrderStatus);
  const save = useServerFn(adminSaveDigitalProduct);
  const del = useServerFn(adminDeleteDigitalProduct);
  const orders = useQuery({ queryKey: ["digital-orders"], queryFn: () => listO({ data: { access } }) });
  const products = useQuery({ queryKey: ["digital-products"], queryFn: () => listDigitalProducts() });
  const [edit, setEdit] = useState<DigitalProduct | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function update(id: string, status: DigitalOrder["status"]) {
    await setStatus({ data: { access, id, status } });
    orders.refetch();
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setErr(null);
    try {
      await save({
        data: {
          access, id: edit?.id,
          title: String(f.get("title")), category: String(f.get("category")) as "giftcard",
          price: Number(f.get("price")), image_url: String(f.get("image") || "") || null,
          stock_status: String(f.get("stock")) as "in_stock", description: String(f.get("desc") ?? ""),
        },
      });
      setEdit(null);
      form.reset();
      products.refetch();
    } catch {
      setErr("تحقق من المعطيات (رابط الصورة يجب أن يكون URL صحيح).");
    }
  }

  return (
    <div dir="rtl" className="space-y-8">
      <div className="overflow-x-auto rounded-xl border border-border bg-card/80">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground"><tr className="border-b border-border text-right">
            <th className="p-3">المنتج</th><th className="p-3">Player ID</th><th className="p-3">واتساب</th><th className="p-3">المبلغ</th><th className="p-3">الحالة</th>
          </tr></thead>
          <tbody>
            {(orders.data ?? []).map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="p-3">{o.product_title}<br /><span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("ar-MA")}</span></td>
                <td className="p-3 font-mono-code" dir="ltr">{o.player_id}</td>
                <td className="p-3"><a className="text-primary underline" dir="ltr" target="_blank" rel="noreferrer" href={`https://wa.me/${o.whatsapp_number.replace(/^0/, "212").replace(/^\+/, "")}`}>{o.whatsapp_number}</a></td>
                <td className="p-3 font-bold">{formatMad(o.total_price)}</td>
                <td className="p-3">
                  <select value={o.status} onChange={(e) => update(o.id, e.target.value as DigitalOrder["status"])} className={field}>
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {orders.data?.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">لا توجد طلبات رقمية.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <form key={edit?.id ?? "new"} onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card/80 p-4 sm:grid-cols-2">
        <h3 className="font-display font-black sm:col-span-2">{edit ? "تعديل منتج" : "إضافة منتج رقمي"}</h3>
        <input name="title" required defaultValue={edit?.title} placeholder="الاسم" className={field} />
        <select name="category" defaultValue={edit?.category ?? "topup"} className={field}>
          {Object.entries(DIGITAL_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input name="price" type="number" min={0} step="0.01" required defaultValue={edit?.price} placeholder="الثمن MAD" className={field} />
        <select name="stock" defaultValue={edit?.stock_status ?? "in_stock"} className={field}>
          <option value="in_stock">متوفر</option><option value="out_of_stock">نفد</option>
        </select>
        <input name="image" type="url" defaultValue={edit?.image_url ?? ""} placeholder="رابط الصورة" className={`${field} sm:col-span-2`} dir="ltr" />
        <input name="desc" defaultValue={edit?.description} placeholder="الوصف" className={`${field} sm:col-span-2`} />
        {err ? <p className="text-sm text-destructive sm:col-span-2">{err}</p> : null}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit">حفظ</Button>
          {edit ? <Button type="button" variant="outline" onClick={() => setEdit(null)}>إلغاء</Button> : null}
        </div>
      </form>

      <div className="grid gap-2">
        {(products.data ?? []).map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card/80 p-3 text-sm">
            <span>{p.title} — {formatMad(p.price)} {p.stock_status !== "in_stock" ? "(نفد)" : ""}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEdit(p)}>تعديل</Button>
              <Button size="sm" variant="destructive" onClick={async () => { if (confirm("حذف المنتج؟")) { await del({ data: { access, id: p.id } }); products.refetch(); } }}>حذف</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
