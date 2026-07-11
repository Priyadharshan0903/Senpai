import { avatarUrl } from "@/lib/avatar";
import { Profile } from "@/lib/types";

export interface ProfileRow {
  id: string;
  name: string;
  initial: string;
  color: string;
  avatarSeed: string;
  custom: number;
  ord: number;
}

export function profileToClient(p: ProfileRow): Profile {
  return {
    id: p.id,
    name: p.name,
    initial: p.initial,
    color: p.color,
    avatar: avatarUrl(p.avatarSeed),
    custom: !!p.custom,
  };
}

export const parseJson = <T>(s: string, fallback: T): T => {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

/** Normalize for duplicate-fact comparison: trim, collapse whitespace, lowercase. */
export function normText(s: string): string {
  return (s || "").trim().replace(/\s+/g, " ").toLowerCase();
}

/** Is this a SQLite/libSQL unique-constraint violation? */
export function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: unknown; message?: unknown; cause?: unknown };
  if (String(e.code ?? "").startsWith("SQLITE_CONSTRAINT")) return true;
  if (String(e.message ?? "").includes("UNIQUE constraint failed")) return true;
  // libsql sometimes nests the real error in `cause`
  return isUniqueViolation(e.cause);
}
