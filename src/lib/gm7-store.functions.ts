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

export const SHIPPING_MAD = 35;
export const FREE_SHIPPING_FROM_MAD = 500;

/* ---------------- Products ---------------- */
export type Product = {
  id: string;
  title: string;
  description: string;
  priceMad: number;
  imageUrl: string | null;
  stock: number;
  active: boolean;
};

export const listProducts = createServerFn({ method: "GET" }).handler(async (): Promise<Product[]> => {
  const db = await admin();
  const { data } = await db
    .from("market_products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });
  return (data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    priceMad: Number(p.price_mad),
    imageUrl: p.image_url,
    stock: p.stock,
    active: p.active,
  }));
});

/* ---------------- Orders (COD) ---------------- */
export type OrderItem = { productId: string; title: string; qty: number; priceMad: number };
export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
  items: OrderItem[];
  subtotalMad: number;
  shippingMad: number;
  totalMad: number;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
  confirmedAt: string | null;
};
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "paid" | "cancelled";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOrder(r: any): Order {
  return {
    id: r.id,
    orderNumber: r.order_number,
    customerName: r.customer_name,
    phone: r.phone,
    city: r.city,
    address: r.address,
    notes: r.notes,
    items: r.items as OrderItem[],
    subtotalMad: Number(r.subtotal_mad),
    shippingMad: Number(r.shipping_mad),
    totalMad: Number(r.total_mad),
    paymentMethod: r.payment_method,
    status: r.status,
    createdAt: r.created_at,
    confirmedAt: r.confirmed_at,
  };
}

export const MA_CITIES = [
  "الدار البيضاء", "الرباط", "سلا", "تمارة", "القنيطرة", "مراكش", "فاس", "مكناس", "طنجة", "تطوان",
  "أكادير", "وجدة", "الناظور", "الحسيمة", "بني ملال", "خريبكة", "الجديدة", "آسفي", "المحمدية", "سطات",
  "العيون", "الداخلة", "كلميم", "تازة", "الراشيدية", "ورزازات", "العرائش", "خنيفرة", "برشيد", "أخرى",
] as const;

const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(60),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s.-]/g, ""))
    .refine((v) => /^(?:\+212|00212|0)[5-7]\d{8}$/.test(v), "invalid phone"),
  city: z.string().trim().min(2).max(40),
  address: z.string().trim().min(5).max(200),
  notes: z.string().trim().max(300).default(""),
  items: z
    .array(z.object({ productId: z.string().uuid(), qty: z.number().int().min(1).max(20) }))
    .min(1)
    .max(30),
});

export const createCodOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderSchema.parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const merged = new Map<string, number>();
    for (const i of data.items) merged.set(i.productId, (merged.get(i.productId) ?? 0) + i.qty);
    const ids = [...merged.keys()];
    const { data: products } = await db.from("market_products").select("*").in("id", ids).eq("active", true);
    const items: OrderItem[] = ids.map((id) => {
      const qty = merged.get(id)!;
      const p = products?.find((x) => x.id === id);
      if (!p) throw new Error("منتج غير متوفر");
      if (qty > 20 || p.stock < qty) throw new Error(`المخزون غير كافٍ: ${p.title}`);
      return { productId: p.id, title: p.title, qty, priceMad: Number(p.price_mad) };
    });
    const reserved: OrderItem[] = [];
    for (const i of items) {
      if (!(await adjustStock(db, i.productId, -i.qty))) {
        for (const r of reserved) await adjustStock(db, r.productId, r.qty);
        throw new Error(`المخزون غير كافٍ: ${i.title}`);
      }
      reserved.push(i);
    }
    const subtotal = items.reduce((s, i) => s + i.qty * i.priceMad, 0);
    const shipping = subtotal >= FREE_SHIPPING_FROM_MAD ? 0 : SHIPPING_MAD;
    const orderNumber = `GM7-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
    const { data: row, error } = await db
      .from("market_orders")
      .insert({
        order_number: orderNumber,
        customer_name: data.customerName,
        phone: data.phone,
        city: data.city,
        address: data.address,
        notes: data.notes,
        items,
        subtotal_mad: subtotal,
        shipping_mad: shipping,
        total_mad: subtotal + shipping,
        payment_method: "cod",
      })
      .select("id")
      .single();
    if (error || !row) throw new Error("تعذر إنشاء الطلب");
    return { id: row.id as string };
  });

export const getInvoice = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<Order | null> => {
    const db = await admin();
    const { data: row } = await db.from("market_orders").select("*").eq("id", data.orderId).maybeSingle();
    return row ? toOrder(row) : null;
  });

export const adminListOrders = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ access: z.string().max(64) }).parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    const { data: rows } = await db.from("market_orders").select("*").order("created_at", { ascending: false }).limit(500);
    return (rows ?? []).map(toOrder);
  });

export const adminSetOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        access: z.string().max(64),
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "shipped", "delivered", "paid", "cancelled"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    const { data: prev } = await db.from("market_orders").select("status, items").eq("id", data.id).maybeSingle();
    if (!prev) throw new Error("Not found");
    await db
      .from("market_orders")
      .update({
        status: data.status,
        ...(data.status === "confirmed" ? { confirmed_at: new Date().toISOString() } : {}),
      })
      .eq("id", data.id);
    const wasCancelled = prev.status === "cancelled";
    const nowCancelled = data.status === "cancelled";
    if (wasCancelled !== nowCancelled) {
      for (const i of (prev.items as OrderItem[]) ?? []) {
        await adjustStock(db, i.productId, nowCancelled ? i.qty : -i.qty);
      }
    }
    return { ok: true };
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function adjustStock(db: any, productId: string, delta: number): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: p } = await db.from("market_products").select("stock").eq("id", productId).maybeSingle();
    if (!p) return false;
    const next = p.stock + delta;
    if (next < 0) return false;
    const { data: upd } = await db
      .from("market_products")
      .update({ stock: next })
      .eq("id", productId)
      .eq("stock", p.stock)
      .select("id");
    if (upd && upd.length) return true;
  }
  return false;
}

/* ---------------- Products admin ---------------- */
const productSchema = z.object({
  access: z.string().max(64),
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(400).default(""),
  priceMad: z.number().min(0).max(100000),
  imageUrl: z.string().trim().url().max(500).nullable().or(z.literal("").transform(() => null)),
  stock: z.number().int().min(0).max(100000),
  active: z.boolean(),
});

export const adminListProducts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ access: z.string().max(64) }).parse(d))
  .handler(async ({ data }): Promise<Product[]> => {
    checkAdmin(data.access);
    const db = await admin();
    const { data: rows } = await db.from("market_products").select("*").order("created_at", { ascending: true });
    return (rows ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      priceMad: Number(p.price_mad),
      imageUrl: p.image_url,
      stock: p.stock,
      active: p.active,
    }));
  });

export const adminSaveProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => productSchema.parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    const row = {
      title: data.title,
      description: data.description,
      price_mad: data.priceMad,
      image_url: data.imageUrl,
      stock: data.stock,
      active: data.active,
    };
    const { error } = data.id
      ? await db.from("market_products").update(row).eq("id", data.id)
      : await db.from("market_products").insert(row);
    if (error) throw new Error("تعذر الحفظ");
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ access: z.string().max(64), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    const { error } = await db.from("market_products").delete().eq("id", data.id);
    if (error) throw new Error("تعذر الحذف");
    return { ok: true };
  });

/* ---------------- Active tournaments ---------------- */
export type ActiveTournament = {
  id: string;
  title: string;
  gameId: string;
  gameName: string;
  platform: string;
  mode: number;
  format: string;
  bracketSize: number;
  prizeMad: number;
  status: "open" | "live" | "finished";
  startsAt: string | null;
  teams: string[];
};

export const listTournaments = createServerFn({ method: "GET" }).handler(async (): Promise<ActiveTournament[]> => {
  const db = await admin();
  const { data } = await db.from("gm7_active_tournaments").select("*").order("created_at", { ascending: false });
  return (data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    gameId: t.game_id,
    gameName: t.game_name,
    platform: t.platform,
    mode: t.mode,
    format: t.format,
    bracketSize: t.bracket_size,
    prizeMad: Number(t.prize_mad),
    status: t.status as ActiveTournament["status"],
    startsAt: t.starts_at,
    teams: (t.teams as string[]) ?? [],
  }));
});

const tournamentSchema = z.object({
  access: z.string().max(64),
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(80),
  gameId: z.string().max(80),
  gameName: z.string().max(80),
  platform: z.enum(["PS5", "PC", "XBOX", "SWITCH", "MOBILE"]),
  mode: z.number().int().min(1).max(5),
  format: z.enum(["knockout", "groups"]),
  bracketSize: z.number().int().refine((n) => [2, 4, 8, 16, 32].includes(n)),
  prizeMad: z.number().min(0).max(10_000_000),
  status: z.enum(["open", "live", "finished"]),
  startsAt: z.string().max(40).nullable(),
  teams: z.array(z.string().max(40)).max(32).default([]),
});

export const adminSaveTournament = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tournamentSchema.parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    const row = {
      title: data.title,
      game_id: data.gameId,
      game_name: data.gameName,
      platform: data.platform,
      mode: data.mode,
      format: data.format,
      bracket_size: data.bracketSize,
      prize_mad: data.prizeMad,
      status: data.status,
      starts_at: data.startsAt || null,
      teams: data.teams,
      updated_at: new Date().toISOString(),
    };
    if (data.id) await db.from("gm7_active_tournaments").update(row).eq("id", data.id);
    else await db.from("gm7_active_tournaments").insert(row);
    return { ok: true };
  });

export const adminDeleteTournament = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ access: z.string().max(64), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    await db.from("gm7_active_tournaments").delete().eq("id", data.id);
    return { ok: true };
  });

/* ---------------- SNNSEI media ---------------- */
export type MediaPlatform = "kick" | "youtube" | "tiktok" | "instagram";
export type MediaItem = {
  id: string;
  platform: MediaPlatform;
  kind: "live" | "video" | "short";
  title: string;
  url: string;
  isLive: boolean;
};

export const listMedia = createServerFn({ method: "GET" }).handler(async (): Promise<MediaItem[]> => {
  const db = await admin();
  const { data } = await db.from("snnsei_media").select("*").order("sort").order("created_at", { ascending: false });
  return (data ?? []).map((m) => ({
    id: m.id,
    platform: m.platform as MediaPlatform,
    kind: m.kind as MediaItem["kind"],
    title: m.title,
    url: m.url,
    isLive: m.is_live,
  }));
});

export const adminAddMedia = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        access: z.string().max(64),
        platform: z.enum(["kick", "youtube", "tiktok", "instagram"]),
        kind: z.enum(["live", "video", "short"]),
        title: z.string().trim().min(2).max(100),
        url: z.string().trim().url().max(300),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    await db.from("snnsei_media").insert({ platform: data.platform, kind: data.kind, title: data.title, url: data.url, sort: 10 });
    return { ok: true };
  });

export const adminUpdateMedia = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ access: z.string().max(64), id: z.string().uuid(), isLive: z.boolean().optional(), remove: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    if (data.remove) await db.from("snnsei_media").delete().eq("id", data.id);
    else if (data.isLive !== undefined) await db.from("snnsei_media").update({ is_live: data.isLive }).eq("id", data.id);
    return { ok: true };
  });
