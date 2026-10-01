export type MatchState = "pending" | "live" | "break" | "finished";

export type Match = {
  id: string;
  round: number;
  index: number;
  a: string | null;
  b: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winner: string | null;
  state: MatchState;
};

export const MATCH_STATE_LABELS: Record<MatchState, string> = {
  pending: "لم تبدأ",
  live: "مباشر",
  break: "استراحة",
  finished: "انتهت",
};

export function nextPow2(n: number): number {
  let size = 2;
  while (size < n) size *= 2;
  return size;
}

export function roundLabel(matchesInRound: number): string {
  if (matchesInRound === 1) return "النهائي";
  if (matchesInRound === 2) return "نصف النهائي";
  if (matchesInRound === 4) return "ربع النهائي";
  return `دور ${matchesInRound * 2}`;
}

/** Builds the full knockout tree from an ordered (seeded) participant list. */
export function buildBracket(participants: string[]): Match[] {
  const clean = participants.map((p) => p.trim()).filter(Boolean);
  const size = nextPow2(Math.max(clean.length, 2));
  const matches: Match[] = [];
  let count = size / 2;
  let round = 0;
  while (count >= 1) {
    for (let index = 0; index < count; index += 1) {
      matches.push({
        id: `r${round}m${index}`,
        round,
        index,
        a: round === 0 ? (clean[index * 2] ?? null) : null,
        b: round === 0 ? (clean[index * 2 + 1] ?? null) : null,
        scoreA: null,
        scoreB: null,
        winner: null,
        state: "pending",
      });
    }
    if (count === 1) break;
    count /= 2;
    round += 1;
  }
  return normalize(matches);
}

function child(matches: Match[], m: Match): Match | undefined {
  return matches.find((x) => x.round === m.round + 1 && x.index === Math.floor(m.index / 2));
}

/** Propagates winners, resolves byes, and keeps slots in sync. */
export function normalize(input: Match[]): Match[] {
  const matches = input.map((m) => ({ ...m }));
  for (let pass = 0; pass < matches.length + 2; pass += 1) {
    let changed = false;
    for (const m of matches) {
      // bye: only one participant present and no opponent possible
      if (!m.winner && m.a && !m.b && m.round === 0) {
        m.winner = m.a;
        m.state = "finished";
        changed = true;
      }
      if (m.winner) {
        const next = child(matches, m);
        if (next) {
          const slot = m.index % 2 === 0 ? "a" : "b";
          if (next[slot] !== m.winner) {
            next[slot] = m.winner;
            changed = true;
          }
        }
      }
    }
    if (!changed) break;
  }
  return matches;
}

export function applyResult(matches: Match[], matchId: string, scoreA: number, scoreB: number): Match[] {
  const next = matches.map((m) => {
    if (m.id !== matchId) return { ...m };
    const winner = scoreA === scoreB ? null : scoreA > scoreB ? m.a : m.b;
    return { ...m, scoreA, scoreB, winner, state: winner ? ("finished" as MatchState) : ("break" as MatchState) };
  });
  return normalize(next);
}

export function setMatchState(matches: Match[], matchId: string, state: MatchState): Match[] {
  return matches.map((m) => (m.id === matchId ? { ...m, state } : m));
}

export function roundsOf(matches: Match[]): Match[][] {
  const max = matches.reduce((n, m) => Math.max(n, m.round), 0);
  return Array.from({ length: max + 1 }, (_, r) =>
    matches.filter((m) => m.round === r).sort((x, y) => x.index - y.index),
  );
}

/** [1st, 2nd, 3rd] — 3rd is derived from the semi-final losers when resolvable. */
export function podiumOf(matches: Match[]): (string | null)[] {
  const rounds = roundsOf(matches);
  const final = rounds[rounds.length - 1]?.[0];
  if (!final?.winner) return [null, null, null];
  const second = final.winner === final.a ? final.b : final.a;
  const semis = rounds[rounds.length - 2] ?? [];
  const losers = semis
    .filter((m) => m.winner)
    .map((m) => (m.winner === m.a ? m.b : m.a))
    .filter((t): t is string => Boolean(t));
  const third = semis.length === 2 && losers.length === 2 ? losers.join(" / ") : (losers[0] ?? null);
  return [final.winner, second, third];
}

export function payouts(prizeMad: number, split: number[], podium: (string | null)[]) {
  return podium.map((name, i) => ({
    place: i + 1,
    name,
    amountMad: Math.round((prizeMad * (split[i] ?? 0)) / 100),
  }));
}
