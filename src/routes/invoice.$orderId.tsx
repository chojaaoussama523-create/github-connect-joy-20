import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getInvoice } from "@/lib/gm7-store.functions";
import { formatMad, ORDER_STATUS_LABELS } from "@/lib/gm7-format";

export const Route = createFileRoute("/invoice/$orderId")({
  loader: async ({ params }) => {
    if (!/^[0-9a-f-]{36}$/i.test(params.orderId)) throw notFound();
    const order = await getInvoice({ data: { orderId: params.orderId } });
    if (!order) throw notFound();
    return { order };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `فاتورة ${loaderData.order.orderNumber} — GM7 Market` : "فاتورة — GM7 Market" },
      { name: "description", content: "فاتورة طلب GM7 Market بالدفع عند الاستلام." },
      { property: "og:title", content: "فاتورة GM7 Market" },
      { property: "og:description", content: "فاتورة طلب بالدفع عند الاستلام." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <p className="text-muted-foreground">هاد الفاتورة ماكايناش.</p>
      <Link to="/market" className="text-primary underline">رجوع للمتجر</Link>
    </div>
  ),
  errorComponent: () => <p className="p-10 text-center text-muted-foreground">تعذر تحميل الفاتورة.</p>,
  component: InvoicePage,
});

function InvoicePage() {
  const { order } = Route.useLoaderData();
  const [format, setFormat] = useState<"a4" | "pos">("a4");
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(window.location.href), []);

  function print(f: "a4" | "pos") {
    setFormat(f);
    setTimeout(() => window.print(), 50);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background py-8 print:bg-white print:py-0">
      <style>{`@media print { @page { size: ${format === "pos" ? "80mm auto" : "A4"}; margin: ${format === "pos" ? "3mm" : "12mm"}; } }`}</style>
      <div className="mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 print:hidden">
        <p className="font-bold text-primary">
          تم تسجيل طلبك — غادي نتاصلو بيك للتأكيد
        </p>
        <div className="flex gap-2">
          <Button variant={format === "a4" ? "default" : "outline"} onClick={() => print("a4")}>
            <Printer /> A4 / PDF
          </Button>
          <Button variant={format === "pos" ? "default" : "outline"} onClick={() => print("pos")}>
            <Printer /> POS 80mm
          </Button>
        </div>
      </div>

      <article className={format === "pos" ? "invoice invoice-pos" : "invoice invoice-a4"}>
        <header className="invoice-head">
          <div>
            <h1 className="text-2xl font-black">GM7 MARKET</h1>
            <p className="text-xs">فاتورة / Facture</p>
          </div>
          <div className="text-left text-xs" dir="ltr">
            <p className="font-bold">{order.orderNumber}</p>
            <p>{new Date(order.createdAt).toLocaleString("fr-MA")}</p>
          </div>
        </header>

        <section className="invoice-block text-sm">
          <p><b>الزبون:</b> {order.customerName}</p>
          <p><b>الهاتف:</b> <span dir="ltr">{order.phone}</span></p>
          <p><b>المدينة:</b> {order.city}</p>
          <p><b>العنوان:</b> {order.address}</p>
          {order.notes ? <p><b>ملاحظات:</b> {order.notes}</p> : null}
        </section>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>المنتج</th>
              <th>الكمية</th>
              <th>الثمن</th>
              <th>المجموع</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.productId}>
                <td>{i.title}</td>
                <td>{i.qty}</td>
                <td>{formatMad(i.priceMad)}</td>
                <td>{formatMad(i.qty * i.priceMad)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="invoice-totals">
          <p><span>المجموع الفرعي</span><span>{formatMad(order.subtotalMad)}</span></p>
          <p><span>التوصيل</span><span>{order.shippingMad === 0 ? "مجاني" : formatMad(order.shippingMad)}</span></p>
          <p className="invoice-grand"><span>الواجب أداؤه</span><span>{formatMad(order.totalMad)}</span></p>
          <p><span>طريقة الأداء</span><span>الدفع عند الاستلام (COD)</span></p>
          <p><span>الحالة</span><span>{ORDER_STATUS_LABELS[order.status] ?? order.status}</span></p>
        </section>

        <footer className="invoice-qr">
          {url ? <QRCodeSVG value={url} size={format === "pos" ? 110 : 130} /> : null}
          <p className="text-xs">امسح الكود للوصول للفاتورة وتأكيد القبض</p>
          <p className="text-xs">شكراً على ثقتكم — GM7</p>
        </footer>
      </article>
    </div>
  );
}
