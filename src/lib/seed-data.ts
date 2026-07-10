import { CREW_COLORS, darken } from "./theme";

// Crew members — ported from Canon.dc.html `this.people`.
export const SEED_PROFILES = [
  { key: "ravi", name: "Ravi", color: CREW_COLORS.Ravi },
  { key: "mei", name: "Mei", color: CREW_COLORS.Mei },
  { key: "kenji", name: "Kenji", color: CREW_COLORS.Kenji },
  { key: "aisha", name: "Aisha", color: CREW_COLORS.Aisha },
  { key: "theo", name: "Theo", color: CREW_COLORS.Theo },
  { key: "yuki", name: "Yuki", color: CREW_COLORS.Yuki },
];

// Fire / Cry / Mind-blown / Crown / Care
const [FIRE, CRY, MIND, CROWN, CARE] = [
  "\u{1F525}",
  "\u{1F62D}",
  "\u{1F92F}",
  "\u{1F451}",
  "\u{1FAF6}",
];

type SeedWatch = {
  user: string;
  rating: number;
  mood: string;
  platform: string;
  reflect: string;
  momentTitle?: string;
  momentWhy?: string;
  rewatch?: number;
};

type SeedFact = { user: string; text: string; confirms?: string[] };

export interface SeedShow {
  key: string;
  anilistId: number;
  title: string;
  year: string;
  ep: string;
  genres: string[];
  cover: string;
  color: string; // base color; c1=color, c2=darken(color)
  time: string;
  emotes: Record<string, number>;
  watches: SeedWatch[];
  facts: SeedFact[];
}

// Cover art + theme colors are the exact AniList CDN urls the prototype ships with.
export const SEED_SHOWS: SeedShow[] = [
  {
    key: "fri",
    anilistId: 154587,
    title: "Frieren",
    year: "2023",
    ep: "28 eps",
    genres: ["Fantasy", "Adventure", "Drama"],
    cover:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg",
    color: "#3a8f86",
    time: "2h",
    emotes: { [FIRE]: 19, [CRY]: 24, [MIND]: 5, [CROWN]: 11, [CARE]: 14 },
    watches: [
      {
        user: "kenji",
        rating: 9.4,
        mood: "Peak",
        platform: "Crunchyroll",
        reflect:
          "Never felt time and grief animated like this. Quiet devastation, episode after episode.",
        momentTitle: "Ep 1 — Himmel’s funeral",
        momentWhy:
          "Frieren realizing she never truly knew him. A gut punch in the first 20 minutes.",
        rewatch: 0,
      },
      {
        user: "mei",
        rating: 9.0,
        mood: "Devastating",
        platform: "Netflix",
        reflect:
          "Cried more than I’d like to admit. The flashbacks absolutely ruin me every time.",
        momentTitle: "The “because you taught me” scene",
        momentWhy: "Fern and Frieren’s bond snuck up on me completely.",
        rewatch: 0,
      },
      {
        user: "yuki",
        rating: 8.5,
        mood: "Comfort",
        platform: "Crunchyroll",
        reflect:
          "My comfort watch of the whole season. Somehow puts me at peace and wrecks me at once.",
        rewatch: 1,
      },
    ],
    facts: [
      {
        user: "kenji",
        text:
          "The Japanese title 「葬送のフリーレン」 translates to “Frieren of the Funeral.”",
        confirms: ["mei", "ravi"],
      },
      {
        user: "mei",
        text:
          "Evan Call’s soundtrack was recorded with a live orchestra in Europe.",
        confirms: ["theo"],
      },
    ],
  },
  {
    key: "edg",
    anilistId: 120377,
    title: "Cyberpunk: Edgerunners",
    year: "2022",
    ep: "10 eps",
    genres: ["Sci-Fi", "Action", "Drama"],
    cover:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-ayZPoxiWt4Li.jpg",
    color: "#4a7a2e",
    time: "5h",
    emotes: { [FIRE]: 31, [CRY]: 22, [MIND]: 14, [CROWN]: 9, [CARE]: 8 },
    watches: [
      {
        user: "ravi",
        rating: 9.1,
        mood: "Devastating",
        platform: "Netflix",
        reflect:
          "10 episodes and it wrecked me. No filler, all heart, brutal ending.",
        momentTitle: "Ep 10 — the rooftop",
        momentWhy: "David and Lucy. That’s it. That’s the whole review.",
        rewatch: 0,
      },
      {
        user: "theo",
        rating: 8.7,
        mood: "Hyped",
        platform: "Netflix",
        reflect:
          "The animation goes absolutely feral. Trigger really cooked with this one.",
        momentTitle: "Any Sandevistan sequence",
        momentWhy: "The time-slow choreography is genuinely unreal.",
        rewatch: 2,
      },
    ],
    facts: [
      {
        user: "ravi",
        text:
          "Studio Trigger built it as a love letter to CD Projekt’s game world.",
        confirms: ["theo", "kenji"],
      },
      {
        user: "theo",
        text: "The ending theme charted worldwide weeks after the show dropped.",
        confirms: [],
      },
    ],
  },
  {
    key: "dan",
    anilistId: 171018,
    title: "Dandadan",
    year: "2024",
    ep: "12 eps",
    genres: ["Action", "Comedy", "Supernatural"],
    cover:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-60q1B6GK2Ghb.jpg",
    color: "#b5552b",
    time: "1d",
    emotes: { [FIRE]: 17, [CRY]: 2, [MIND]: 12, [CROWN]: 6, [CARE]: 9 },
    watches: [
      {
        user: "theo",
        rating: 8.8,
        mood: "Hyped",
        platform: "Netflix",
        reflect:
          "Chaos in the best possible way. Never slows down, and somehow it’s also romantic.",
        momentTitle: "Turbo Granny chase",
        momentWhy: "Unhinged pacing — I was genuinely screaming.",
        rewatch: 0,
      },
    ],
    facts: [],
  },
  {
    key: "csm",
    anilistId: 127230,
    title: "Chainsaw Man",
    year: "2022",
    ep: "12 eps",
    genres: ["Action", "Horror", "Supernatural"],
    cover:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-DdP4vAdssLoz.png",
    color: "#6b1a1a",
    time: "2d",
    emotes: { [FIRE]: 21, [CRY]: 4, [MIND]: 8, [CROWN]: 7, [CARE]: 5 },
    watches: [
      {
        user: "mei",
        rating: 8.2,
        mood: "Hyped",
        platform: "Crunchyroll",
        reflect:
          "Style for days. Denji is a walking disaster and I love him for it.",
        momentTitle: "Katana Man fight",
        momentWhy: "The needle-drop plus the choreography — insane.",
        rewatch: 0,
      },
      {
        user: "ravi",
        rating: 7.5,
        mood: "Mid",
        platform: "Crunchyroll",
        reflect:
          "Great vibes, but the story took a bit to really grab me.",
        rewatch: 0,
      },
    ],
    facts: [
      {
        user: "mei",
        text:
          "Every episode has a completely different ending theme, each by a new artist.",
        confirms: ["aisha"],
      },
    ],
  },
  {
    key: "vin",
    anilistId: 101348,
    title: "Vinland Saga",
    year: "2019",
    ep: "48 eps",
    genres: ["Action", "Drama", "Historical"],
    cover:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101348-2fhDFPCuMNiz.jpg",
    color: "#4a6a78",
    time: "3d",
    emotes: { [FIRE]: 14, [CRY]: 11, [MIND]: 6, [CROWN]: 15, [CARE]: 10 },
    watches: [
      {
        user: "kenji",
        rating: 9.0,
        mood: "Peak",
        platform: "Local / Other",
        reflect:
          "A revenge story that quietly becomes about the exact opposite. Season 2 is a masterpiece.",
        momentTitle: "“I have no enemies”",
        momentWhy: "Thorfinn’s entire arc distilled into one line.",
        rewatch: 1,
      },
    ],
    facts: [],
  },
  {
    key: "spy",
    anilistId: 140960,
    title: "Spy x Family",
    year: "2022",
    ep: "37 eps",
    genres: ["Comedy", "Action", "Slice of Life"],
    cover:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-Kb6R5nYQfjmP.jpg",
    color: "#3a7a7a",
    time: "4d",
    emotes: { [FIRE]: 9, [CRY]: 3, [MIND]: 2, [CROWN]: 8, [CARE]: 27 },
    watches: [
      {
        user: "yuki",
        rating: 8.9,
        mood: "Comfort",
        platform: "Disney+ / Hotstar",
        reflect:
          "Pure serotonin. Anya single-handedly carries the entire operation.",
        momentTitle: "Anya’s “waku waku”",
        momentWhy: "I would defend her with my life, simple as that.",
        rewatch: 1,
      },
      {
        user: "aisha",
        rating: 9.1,
        mood: "Peak",
        platform: "Crunchyroll",
        reflect: "Found family done perfectly. Cozy, hilarious, and secretly tense.",
        rewatch: 2,
      },
    ],
    facts: [],
  },
];

export function c1c2(color: string): { c1: string; c2: string } {
  return { c1: color, c2: darken(color) };
}
