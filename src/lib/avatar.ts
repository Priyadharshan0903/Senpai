// Avatar URLs point at our own /api/avatar endpoint (below), which generates the
// DiceBear "adventurer" SVG locally. This keeps avatars offline-cacheable by the
// PWA service worker instead of hot-linking api.dicebear.com on every render —
// while producing the same seeded avatars the prototype used.

export function avatarUrl(seed?: string): string {
  return "/api/avatar?seed=" + encodeURIComponent(seed || "anon");
}
