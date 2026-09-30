import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type RegStatus = "new" | "checked-in" | "accepted" | "waitlist" | "rejected";
export type RegRow = {
  code: string;
  team: string;
  captain: string;
  whatsapp: string;
  discord: string;
  city: string;
  platform: string;
  gameId: string;
  platformId: string;
  mode: number;
  roster: string[];
  sub: string;
  status: RegStatus;
  createdAt: string;
};

const text = (min: number) => z.string().trim().min(min).max(40);

const submitSchema = z.object({
  team: text(2),
  captain: text(2),
  whatsapp: z.string().trim().regex(/^\+?[0-9 ]{8,16}$/),
  discord: z.string().trim().max(40),
  city: text(2),
  platform: z.enum(["PS5", "PC", "XBOX", "SWITCH", "MOBILE"]),
  gameId: z.string().trim().min(1).max(80),
  platformId: text(2),
  mode: z.number().int().min(1).max(5),
  roster: z.array(text(2)).max(4),
  sub: z.string().trim().max(40),
});

function checkAdmin(code: string) {
  const expected = process.env["GM7_ADMIN_ACCESS_CODE"];
  if (!expected || code.trim() !== expected) throw new Error("Unauthorized");
}

type DbRow = {
  code: string; team: string; captain: string; whatsapp: string; discord: string; city: string;
  platform: string; game_id: string; platform_id: string; mode: number; roster: string[]; sub: string;
  status: string; created_at: string;
};

function toDto(r: DbRow): RegRow {
  return {
    code: r.code, team: r.team, captain: r.captain, whatsapp: r.whatsapp, discord: r.discord, city: r.city,
    platform: r.platform, gameId: r.game_id, platformId: r.platform_id, mode: r.mode, roster: r.roster,
    sub: r.sub, status: r.status as RegStatus, createdAt: r.created_at,
  };
}

export const submitRegistration = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.roster.length !== data.mode - 1) throw new Error("Roster mismatch");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = `REG-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
    const { data: row, error } = await supabaseAdmin
      .from("tournament_registrations")
      .insert({
        code, team: data.team, captain: data.captain, whatsapp: data.whatsapp, discord: data.discord,
        city: data.city, platform: data.platform, game_id: data.gameId, platform_id: data.platformId,
        mode: data.mode, roster: data.roster, sub: data.sub,
      })
      .select("*")
      .single();
    if (error || !row) throw new Error("تعذر حفظ التسجيل");
    return toDto(row as DbRow);
  });

export const getMyRegistrations = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ codes: z.array(z.string().max(20)).max(50) }).parse(d))
  .handler(async ({ data }) => {
    if (!data.codes.length) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("tournament_registrations").select("*").in("code", data.codes);
    return (rows ?? []).map((r) => toDto(r as DbRow));
  });

export const checkInRegistration = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ code: z.string().max(20) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("tournament_registrations")
      .update({ status: "checked-in" })
      .eq("code", data.code)
      .in("status", ["new", "accepted"]);
    return { ok: true };
  });

export const adminListRegistrations = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ access: z.string().max(64) }).parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("tournament_registrations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    return (rows ?? []).map((r) => toDto(r as DbRow));
  });

export const adminSetStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      access: z.string().max(64),
      code: z.string().max(20),
      status: z.enum(["new", "checked-in", "accepted", "waitlist", "rejected"]),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("tournament_registrations").update({ status: data.status }).eq("code", data.code);
    return { ok: true };
  });
