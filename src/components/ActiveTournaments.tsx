import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Calendar, Trophy } from "lucide-react";
import { listTournaments } from "@/lib/gm7-store.functions";
import { formatMad } from "@/lib/gm7-format";

export const tournamentsQuery = queryOptions({ queryKey: ["active-tournaments"], queryFn: () => listTournaments() });

export const T_STATUS: Record<string, string> = { open: "التسجيل مفتوح", live: "جارية الآن", finished: "انتهت" };

export function ActiveTournaments() {
  const { data } = useSuspenseQuery(tournamentsQuery);
  return (
    <section dir="rtl" className="mb-10">
      <h2 className="mb-4 font-display text-2xl font-black">البطولات النشطة</h2>
      {data.length === 0 ? (
        <p className="text-muted-foreground">لا توجد بطولات حالياً — ترقبوا الإعلان.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card/80 backdrop-blur">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border text-right">
                <th className="p-3">البطولة</th><th className="p-3">اللعبة</th><th className="p-3">الجهاز</th>
                <th className="p-3">النمط</th><th className="p-3">الفرق</th><th className="p-3">الجائزة</th>
                <th className="p-3">التاريخ</th><th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-bold"><Trophy className="me-1 inline size-4 text-primary" />{t.title}</td>
                  <td className="p-3">{t.gameName}</td>
                  <td className="p-3">{t.platform}</td>
                  <td className="p-3">{t.mode}v{t.mode}</td>
                  <td className="p-3">{t.bracketSize}</td>
                  <td className="p-3 font-bold text-primary">{formatMad(t.prizeMad)}</td>
                  <td className="p-3">
                    {t.startsAt ? (<><Calendar className="me-1 inline size-4" />{new Date(t.startsAt).toLocaleDateString("fr-MA")}</>) : "—"}
                  </td>
                  <td className="p-3">{T_STATUS[t.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
