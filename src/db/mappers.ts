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

/** Is this a SQLite unique-constraint violation? */
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    String((err as { code: unknown }).code).startsWith("SQLITE_CONSTRAINT")
  );
}
