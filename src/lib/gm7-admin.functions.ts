import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const accessSchema = z.object({
  code: z.string().trim().min(1, "الكود مطلوب").max(64, "الكود طويل جداً"),
});

type AttemptRecord = { count: number; firstAttemptAt: number; lockedUntil: number };

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;
const LOCKOUT_MS = 10 * 60 * 1000;

const attempts = new Map<string, AttemptRecord>();

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

export type AdminAccessResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "locked" | "unconfigured"; retryAfterSeconds?: number };

export const verifyAdminAccess = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => accessSchema.parse(data))
  .handler(async ({ data }): Promise<AdminAccessResult> => {
    const expected = process.env["GM7_ADMIN_ACCESS_CODE"];
    if (!expected) {
      return { ok: false, reason: "unconfigured" };
    }

    const request: Request | undefined = getRequest();
    const identity =
      request?.headers.get("cf-connecting-ip") ??
      request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    const now = Date.now();
    const record = attempts.get(identity);

    if (record && record.lockedUntil > now) {
      return {
        ok: false,
        reason: "locked",
        retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
      };
    }

    if (timingSafeEqual(data.code.trim(), expected)) {
      attempts.delete(identity);
      return { ok: true };
    }

    if (!record || now - record.firstAttemptAt > WINDOW_MS) {
      attempts.set(identity, { count: 1, firstAttemptAt: now, lockedUntil: 0 });
      return { ok: false, reason: "invalid" };
    }

    const nextCount = record.count + 1;
    if (nextCount >= MAX_ATTEMPTS) {
      attempts.set(identity, {
        count: nextCount,
        firstAttemptAt: record.firstAttemptAt,
        lockedUntil: now + LOCKOUT_MS,
      });
      return { ok: false, reason: "locked", retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000) };
    }

    attempts.set(identity, { ...record, count: nextCount });
    return { ok: false, reason: "invalid" };
  });
