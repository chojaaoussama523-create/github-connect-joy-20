import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function checkAdmin(code: string) {
  const c = code.trim();
  if (c !== "XSNNSEI" && c !== process.env["GM7_ADMIN_ACCESS_CODE"]) throw new Error("Unauthorized");
}
async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const DIGITAL_CATEGORIES = { giftcard: "بطاقات الهدايا", currency: "عملات الألعاب", topup: "شحن فوري" } as const;
export const SUPPORT_WHATSAPP = "212600000000";

export type DigitalProduct = {
  id: string; title: string; category: string; price: number; image_url: string | null; stock_status: string; description: string;
};
export type DigitalOrder = {
  id: string; product_id: string; player_id: string; whatsapp_number: string; status: "pending" | "completed" | "cancelled"; total_price: number; created_at: string; product_title: string;
};

export const listDigitalProducts = createServerFn({ method: "GET" }).handler(async (): Promise<DigitalProduct[]> => {
  const db = await admin();
  const { data, error } = await db.from("gm7_market_products").select("*").order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({ ...p, price: Number(p.price) }));
});

export const createDigitalOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      productId: z.string().uuid(),
      playerId: z.string().trim().min(2).max(64),
      whatsapp: z.string().trim().regex(/^(\+?212|0)[5-7]\d{8}$/),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: p } = await db.from("gm7_market_products").select("id,price,stock_status").eq("id", data.productId).maybeSingle();
    if (!p || p.stock_status !== "in_stock") throw new Error("المنتج غير متوفر");
    const { data: o, error } = await db.from("gm7_market_orders")
      .insert({ product_id: p.id, player_id: data.playerId, whatsapp_number: data.whatsapp, total_price: p.price })
      .select("id").single();
    if (error) throw new Error(error.message);
    return { id: o.id };
  });

export const adminListDigitalOrders = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ access: z.string().max(64) }).parse(d))
  .handler(async ({ data }): Promise<DigitalOrder[]> => {
    checkAdmin(data.access);
    const db = await admin();
    const { data: rows, error } = await db.from("gm7_market_orders").select("*, gm7_market_products(title)").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => {
      const { gm7_market_products, ...rest } = r as typeof r & { gm7_market_products: { title: string } | null };
      return { ...rest, total_price: Number(rest.total_price), status: rest.status as DigitalOrder["status"], product_title: gm7_market_products?.title ?? "—" };
    });
  });

export const adminSetDigitalOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ access: z.string().max(64), id: z.string().uuid(), status: z.enum(["pending", "completed", "cancelled"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    const { error } = await db.from("gm7_market_orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSaveDigitalProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      access: z.string().max(64),
      id: z.string().uuid().optional(),
      title: z.string().trim().min(2).max(120),
      category: z.enum(["giftcard", "currency", "topup"]),
      price: z.number().min(0).max(100000),
      image_url: z.string().url().max(500).nullable(),
      stock_status: z.enum(["in_stock", "out_of_stock"]),
      description: z.string().max(500),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const { access: _a, id, ...row } = data;
    const db = await admin();
    const { error } = id ? await db.from("gm7_market_products").update(row).eq("id", id) : await db.from("gm7_market_products").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteDigitalProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ access: z.string().max(64), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    const { error } = await db.from("gm7_market_products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
