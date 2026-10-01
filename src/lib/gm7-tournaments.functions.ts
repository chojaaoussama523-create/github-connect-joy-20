import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { applyResult, buildBracket, normalize, payouts, podiumOf, setMatchState, type Match } from "@/lib/gm7-bracket";
import { DEFAULT_SPLIT, type Lifecycle } from "@/lib/gm7-tournament-meta";

function checkAdmin(code: string) {
  const expected = process.env["GM7_ADMIN_ACCESS_CODE"];
  if (!expected || code.trim() !== expected) throw new Error("Unauthorized");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export type Tournament = {
  id: string;
  title: string;
  description: string;
  category: string;
  gameId: string;
  gameName: string;
  platform: string;
  mode: number;
  format: string;
  bracketSize: number;
  slots: number;
  prizeMad: number;
  prizeSplit: number[];
  status: Lifecycle;
  startsAt: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  thumbUrl: string | null;
  discordUrl: string | null;
  streamUrl: string | null;
  teams: string[];
  matches: Match[];
  podium: (string | null)[];
  aiNotes: string;
  registered: number;
};

export type Registration = {
  id: string;
  tournamentId: string;
  mode: number;
  teamName: string;
  captainName: string;
  phone: string;
  discord: string;
  city: string;
  platformId: string;
  players: { name: string; ign: string }[];
  status: string;
  createdAt: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function toTournament(r: any, registered = 0): Tournament {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    category: r.category ?? "OTHER",
    gameId: r.game_id,
    gameName: r.game_name,
    platform: r.platform,
    mode: r.mode,
    format: r.format,
    bracketSize: r.bracket_size,
    slots: r.slots ?? r.bracket_size,
    prizeMad: Number(r.prize_mad),
    prizeSplit: (r.prize_split as number[]) ?? DEFAULT_SPLIT,
    status: r.status as Lifecycle,
    startsAt: r.starts_at,
    logoUrl: r.logo_url,
    bannerUrl: r.banner_url,
    thumbUrl: r.thumb_url,
    discordUrl: r.discord_url,
    streamUrl: r.stream_url,
    teams: (r.teams as string[]) ?? [],
    matches: (r.matches as Match[]) ?? [],
    podium: (r.podium as (string | null)[]) ?? [],
    aiNotes: r.ai_notes ?? "",
    registered,
  };
}

function toRegistration(r: any): Registration {
  return {
    id: r.id,
    tournamentId: r.tournament_id,
    mode: r.mode,
    teamName: r.team_name,
    captainName: r.captain_name,
    phone: r.phone,
    discord: r.discord,
    city: r.city,
    platformId: r.platform_id,
    players: (r.players as { name: string; ign: string }[]) ?? [],
    status: r.status,
    createdAt: r.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function withCounts(db: Awaited<ReturnType<typeof admin>>, rows: unknown[]): Promise<Tournament[]> {
  const list = rows as { id: string }[];
  if (list.length === 0) return [];
  const { data: regs } = await db
    .from("gm7_tournament_registrations")
    .select("tournament_id")
    .in(
      "tournament_id",
      list.map((r) => r.id),
    );
  const counts = new Map<string, number>();
  for (const r of regs ?? []) counts.set(r.tournament_id, (counts.get(r.tournament_id) ?? 0) + 1);
  return list.map((r) => toTournament(r, counts.get(r.id) ?? 0));
}

/* ---------------- Public ---------------- */

export const listPublicTournaments = createServerFn({ method: "GET" }).handler(async (): Promise<Tournament[]> => {
  const db = await admin();
  const { data } = await db
    .from("gm7_active_tournaments")
    .select("*")
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  return withCounts(db, data ?? []);
});

const playerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  ign: z.string().trim().min(2).max(60),
});

const registrationSchema = z.object({
  tournamentId: z.string().uuid(),
  teamName: z.string().trim().max(60).default(""),
  captainName: z.string().trim().min(2).max(60),
  phone: z.string().trim().regex(/^\+?[0-9 ]{9,16}$/, "رقم هاتف غير صحيح"),
  discord: z.string().trim().max(60).default(""),
  city: z.string().trim().min(2).max(40),
  platformId: z.string().trim().min(2).max(60),
  players: z.array(playerSchema).max(32).default([]),
});

export const registerForTournament = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => registrationSchema.parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: t } = await db
      .from("gm7_active_tournaments")
      .select("*")
      .eq("id", data.tournamentId)
      .maybeSingle();
    if (!t) throw new Error("البطولة غير موجودة");
    if (t.status !== "in_progress") throw new Error("التسجيل مغلق في هذه البطولة");

    const { count } = await db
      .from("gm7_tournament_registrations")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", data.tournamentId);
    const slots = (t.slots as number) ?? t.bracket_size;
    if ((count ?? 0) >= slots) throw new Error("اكتمل عدد المقاعد");

    const { error } = await db.from("gm7_tournament_registrations").insert({
      tournament_id: data.tournamentId,
      mode: t.mode,
      team_name: data.teamName || data.captainName,
      captain_name: data.captainName,
      phone: data.phone,
      discord: data.discord,
      city: data.city,
      platform_id: data.platformId,
      players: data.players,
    });
    if (error) throw new Error("تعذر إرسال التسجيل");
    return { ok: true, remaining: Math.max(slots - (count ?? 0) - 1, 0) };
  });

/* ---------------- Admin: tournaments ---------------- */

const tournamentSchema = z.object({
  access: z.string().max(64),
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1200).default(""),
  category: z.string().trim().max(30).default("OTHER"),
  gameId: z.string().trim().max(80),
  gameName: z.string().trim().min(1).max(80),
  platform: z.string().trim().max(20),
  mode: z.number().int().min(1).max(5),
  format: z.string().trim().max(30),
  slots: z.number().int().refine((n) => [8, 16, 32, 64, 128].includes(n), "سعة غير مدعومة"),
  prizeMad: z.number().min(0).max(10_000_000),
  prizeSplit: z.array(z.number().min(0).max(100)).length(3).default(DEFAULT_SPLIT),
  status: z.enum(["pending", "in_progress", "active", "completed", "cancelled"]),
  startsAt: z.string().max(40).nullable().default(null),
  logoUrl: z.string().trim().max(400).nullable().default(null),
  bannerUrl: z.string().trim().max(400).nullable().default(null),
  thumbUrl: z.string().trim().max(400).nullable().default(null),
  discordUrl: z.string().trim().max(400).nullable().default(null),
  streamUrl: z.string().trim().max(400).nullable().default(null),
});

export const adminListTournaments = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ access: z.string().max(64) }).parse(d))
  .handler(async ({ data }): Promise<Tournament[]> => {
    checkAdmin(data.access);
    const db = await admin();
    const { data: rows } = await db.from("gm7_active_tournaments").select("*").order("created_at", { ascending: false });
    return withCounts(db, rows ?? []);
  });

export const adminSaveTournament = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tournamentSchema.parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    const row = {
      title: data.title,
      description: data.description,
      category: data.category,
      game_id: data.gameId || data.gameName.toLowerCase().replace(/\s+/g, "-"),
      game_name: data.gameName,
      platform: data.platform,
      mode: data.mode,
      format: data.format,
      bracket_size: Math.min(data.slots, 32),
      slots: data.slots,
      prize_mad: data.prizeMad,
      prize_split: data.prizeSplit,
      status: data.status,
      starts_at: data.startsAt || null,
      logo_url: data.logoUrl || null,
      banner_url: data.bannerUrl || null,
      thumb_url: data.thumbUrl || null,
      discord_url: data.discordUrl || null,
      stream_url: data.streamUrl || null,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await db.from("gm7_active_tournaments").update(row).eq("id", data.id);
      if (error) throw new Error("تعذر تحديث البطولة");
    } else {
      const { error } = await db.from("gm7_active_tournaments").insert(row);
      if (error) throw new Error("تعذر إنشاء البطولة");
    }
    return { ok: true };
  });

export const adminSetTournamentStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        access: z.string().max(64),
        id: z.string().uuid(),
        status: z.enum(["pending", "in_progress", "active", "completed", "cancelled"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    await db
      .from("gm7_active_tournaments")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
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

/* ---------------- Admin: registrations ---------------- */

export const adminListRegistrations = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ access: z.string().max(64), tournamentId: z.string().uuid().optional() }).parse(d),
  )
  .handler(async ({ data }): Promise<Registration[]> => {
    checkAdmin(data.access);
    const db = await admin();
    let query = db.from("gm7_tournament_registrations").select("*").order("created_at", { ascending: true });
    if (data.tournamentId) query = query.eq("tournament_id", data.tournamentId);
    const { data: rows } = await query.limit(500);
    return (rows ?? []).map(toRegistration);
  });

export const adminSetRegistrationStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        access: z.string().max(64),
        id: z.string().uuid(),
        status: z.enum(["pending", "approved", "rejected"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    await db.from("gm7_tournament_registrations").update({ status: data.status }).eq("id", data.id);
    return { ok: true };
  });

/* ---------------- Draw + match center ---------------- */

export const adminStartDraw = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ access: z.string().max(64), id: z.string().uuid(), useAi: z.boolean().default(true) }).parse(d),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    const { data: t } = await db.from("gm7_active_tournaments").select("*").eq("id", data.id).maybeSingle();
    if (!t) throw new Error("البطولة غير موجودة");
    const { data: regs } = await db
      .from("gm7_tournament_registrations")
      .select("*")
      .eq("tournament_id", data.id)
      .neq("status", "rejected")
      .order("created_at", { ascending: true });

    let names = (regs ?? []).map((r) => (r.team_name || r.captain_name) as string);
    if (names.length < 2) throw new Error("يجب توفر مشاركين اثنين على الأقل");

    let note = "";
    if (data.useAi) {
      try {
        const { askGm7Ai } = await import("@/lib/gm7-ai.server");
        const answer = await askGm7Ai(
          "أنت مدير بطولات إلكترونية محترف. مهمتك ترتيب القرعة بشكل عادل (seeding) وتوزيع المقاعد الفارغة (byes) بإنصاف. أجب فقط بـ JSON بالشكل {\"order\":[\"اسم\",...],\"note\":\"سطر توضيحي قصير بالعربية\"} ويجب أن تحتوي order على نفس الأسماء بدون زيادة أو نقص.",
          `بطولة: ${t.title}\nاللعبة: ${t.game_name}\nالنمط: ${t.mode}v${t.mode}\nعدد المقاعد: ${t.slots}\nالمشاركون:\n${names.join("\n")}`,
        );
        const match = answer.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]) as { order?: string[]; note?: string };
          const order = parsed.order ?? [];
          const same = order.length === names.length && names.every((n) => order.includes(n));
          if (same) names = order;
          note = parsed.note ?? "";
        }
      } catch {
        note = "تم توليد القرعة محلياً (المساعد الذكي غير متاح).";
      }
    }

    const matches = buildBracket(names);
    await db
      .from("gm7_active_tournaments")
      .update({
        teams: names,
        matches,
        bracket_size: Math.min(names.length <= 32 ? names.length : 32, 32),
        status: "active",
        ai_notes: note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    return { ok: true, note, teams: names };
  });

export const adminReportScore = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        access: z.string().max(64),
        id: z.string().uuid(),
        matchId: z.string().max(20),
        scoreA: z.number().int().min(0).max(99),
        scoreB: z.number().int().min(0).max(99),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    const { data: t } = await db.from("gm7_active_tournaments").select("matches").eq("id", data.id).maybeSingle();
    if (!t) throw new Error("البطولة غير موجودة");
    const matches = applyResult((t.matches as Match[]) ?? [], data.matchId, data.scoreA, data.scoreB);
    await db
      .from("gm7_active_tournaments")
      .update({ matches, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: true };
  });

export const adminSetMatchState = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        access: z.string().max(64),
        id: z.string().uuid(),
        matchId: z.string().max(20),
        state: z.enum(["pending", "live", "break", "finished"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    const { data: t } = await db.from("gm7_active_tournaments").select("matches").eq("id", data.id).maybeSingle();
    if (!t) throw new Error("البطولة غير موجودة");
    const matches = setMatchState(normalize((t.matches as Match[]) ?? []), data.matchId, data.state);
    await db.from("gm7_active_tournaments").update({ matches }).eq("id", data.id);
    return { ok: true };
  });

export const adminCompleteTournament = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ access: z.string().max(64), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    const { data: t } = await db.from("gm7_active_tournaments").select("*").eq("id", data.id).maybeSingle();
    if (!t) throw new Error("البطولة غير موجودة");
    const podium = podiumOf((t.matches as Match[]) ?? []);
    if (!podium[0]) throw new Error("لم يتحدد البطل بعد");
    const split = ((t.prize_split as number[]) ?? DEFAULT_SPLIT).slice(0, 3);
    const breakdown = payouts(Number(t.prize_mad), split, podium);
    await db
      .from("gm7_active_tournaments")
      .update({
        podium,
        status: "completed",
        ai_notes: breakdown
          .map((p) => `المركز ${p.place}: ${p.name ?? "—"} — ${p.amountMad} درهم`)
          .join(" | "),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    return { ok: true, podium, breakdown };
  });

/* ---------------- AI assistant ---------------- */

const SYSTEMS: Record<string, string> = {
  seeding:
    "أنت مساعد إدارة بطولات GM7. راجع قائمة المشاركين والقرعة واقترح تحسينات عادلة وخطة جدولة المباريات. أجب بالعربية بنقاط قصيرة.",
  dispute:
    "أنت محكّم بطولات إلكترونية. حلّل تفاصيل النزاع على النتيجة والأدلة المذكورة واقترح حكماً واضحاً مع المبرر وخطوة تنفيذية للأدمن. أجب بالعربية بنقاط قصيرة.",
  accounting:
    "أنت مسؤول مالي لبطولات GM7. احسب توزيع الجوائز بدقة بالدرهم المغربي حسب النسب المعطاة، واذكر المجموع وأي ملاحظة ضريبية أو تحقق مطلوب. أجب بالعربية بنقاط قصيرة.",
  insights:
    "أنت معلّق بطولات GM7. اكتب ملخصاً حياً جاذباً لحالة البطولة والمباريات والجولة القادمة، بالعربية وفي أقل من 120 كلمة.",
};

export const adminAiAssist = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        access: z.string().max(64),
        id: z.string().uuid(),
        task: z.enum(["seeding", "dispute", "accounting", "insights"]),
        note: z.string().trim().max(1500).default(""),
        save: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.access);
    const db = await admin();
    const { data: t } = await db.from("gm7_active_tournaments").select("*").eq("id", data.id).maybeSingle();
    if (!t) throw new Error("البطولة غير موجودة");
    const matches = (t.matches as Match[]) ?? [];
    const podium = podiumOf(matches);
    const split = ((t.prize_split as number[]) ?? DEFAULT_SPLIT).slice(0, 3);

    const context = [
      `البطولة: ${t.title}`,
      `اللعبة: ${t.game_name} (${t.category ?? "OTHER"}) — ${t.platform}`,
      `النمط: ${t.mode}v${t.mode} | النظام: ${t.format} | المقاعد: ${t.slots}`,
      `مجموع الجوائز: ${t.prize_mad} درهم | النسب: ${split.join("/")}%`,
      `الحالة: ${t.status}`,
      `الفرق: ${((t.teams as string[]) ?? []).join(", ") || "—"}`,
      `المباريات: ${
        matches
          .filter((m) => m.a || m.b)
          .map((m) => `${m.id} ${m.a ?? "?"} ${m.scoreA ?? "-"}:${m.scoreB ?? "-"} ${m.b ?? "?"} [${m.state}]`)
          .join(" ; ") || "لم تُسحب القرعة"
      }`,
      `منصة التتويج: ${podium.filter(Boolean).join(" / ") || "غير محددة"}`,
      data.note ? `ملاحظة الأدمن / تفاصيل النزاع: ${data.note}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { askGm7Ai } = await import("@/lib/gm7-ai.server");
    const answer = await askGm7Ai(SYSTEMS[data.task]!, context);
    if (data.save && answer) await db.from("gm7_active_tournaments").update({ ai_notes: answer }).eq("id", data.id);
    return { answer: answer || "لم يصل أي جواب من المساعد." };
  });
