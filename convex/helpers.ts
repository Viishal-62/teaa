// ─── Slug Generator ───
// Creates a URL-friendly slug from a name + random suffix
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-") // spaces to dashes
    .replace(/-+/g, "-") // collapse dashes
    .trim()
    .slice(0, 30); // limit length

  const suffix = Math.random().toString(36).substring(2, 6); // 4-char random
  return `${base}-${suffix}`;
}

// ─── Anonymous Name Generator ───
// Creates fun anonymous display names
const adjectives = [
  "shadow",
  "midnight",
  "silent",
  "hidden",
  "mystic",
  "velvet",
  "cosmic",
  "foggy",
  "drifting",
  "wandering",
  "restless",
  "fading",
  "ghostly",
  "secret",
  "nameless",
  "stray",
  "pale",
  "dreamy",
  "lost",
  "hollow",
];

const nouns = [
  "fox",
  "owl",
  "wolf",
  "moth",
  "crow",
  "deer",
  "hare",
  "lynx",
  "swan",
  "hawk",
  "pike",
  "wren",
  "dove",
  "finch",
  "viper",
  "raven",
  "ghost",
  "shade",
  "echo",
  "flame",
];

const emojis = [
  "🦊",
  "🦉",
  "🐺",
  "🦋",
  "🐦‍⬛",
  "🦌",
  "🐇",
  "🐈‍⬛",
  "🦢",
  "🦅",
  "🐠",
  "🐦",
  "🕊️",
  "🐤",
  "🐍",
  "🪶",
  "👻",
  "🌑",
  "🔮",
  "🔥",
];

export function generateAnonName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  return `${adj} ${noun} ${emoji}`;
}

// ─── Categories ───
export const CATEGORIES = [
  "regret",
  "love",
  "guilt",
  "relief",
  "longing",
  "mischief",
  "obsession",
  "pride",
  "fear",
  "envy",
  "deep-dark",
] as const;

export type Category = (typeof CATEGORIES)[number];

// ─── Reaction Types ───
export const REACTION_TYPES = [
  { key: "holding-you", label: "Holding you", emoji: "🤝" },
  { key: "feels-heavy", label: "Feels heavy", emoji: "🫂" },
  { key: "youll-be-ok", label: "You'll be ok", emoji: "🌸" },
  { key: "no-it-burns", label: "No it burns", emoji: "🔥" },
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number]["key"];

// ─── Themes ───
export const THEMES = [
  {
    key: "midnight-rose",
    name: "Midnight Rose",
    emoji: "🌹",
    bg: "#1a0a0a",
    card: "#2d1515",
    accent: "#c43a3a",
    text: "#f5e6e0",
  },
  {
    key: "moonlit",
    name: "Moonlit",
    emoji: "🌙",
    bg: "#0a0e1a",
    card: "#131a2d",
    accent: "#d4a857",
    text: "#e8e0d0",
  },
  {
    key: "forest-whisper",
    name: "Forest Whisper",
    emoji: "🌿",
    bg: "#0a1a0f",
    card: "#152d1c",
    accent: "#5a9e6f",
    text: "#dce8df",
  },
  {
    key: "violet-hour",
    name: "Violet Hour",
    emoji: "🔮",
    bg: "#130a1a",
    card: "#1f132d",
    accent: "#9b59b6",
    text: "#e4d8ec",
  },
  {
    key: "noir",
    name: "Noir",
    emoji: "🖤",
    bg: "#0a0a0a",
    card: "#1a1a1a",
    accent: "#ffffff",
    text: "#e0e0e0",
  },
  {
    key: "chai-spill",
    name: "Chai Spill",
    emoji: "☕",
    bg: "#1a140a",
    card: "#2d2315",
    accent: "#c4883a",
    text: "#f0e6d8",
  },
] as const;

export type ThemeKey = (typeof THEMES)[number]["key"];
