// Utility to get or create a visitor ID (for tracking reactions per visitor)
export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("teaa-visitor-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("teaa-visitor-id", id);
  }
  return id;
}

// Utility to get or create a creator token (for board ownership)
export function getCreatorToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem("teaa-creator-token");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("teaa-creator-token", token);
  }
  return token;
}

// Relative time formatter
export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// Category display info
export const CATEGORY_INFO: Record<
  string,
  { label: string; color: string; emoji: string }
> = {
  regret: { label: "Regret", color: "#e74c3c", emoji: "😔" },
  love: { label: "Love", color: "#e91e63", emoji: "💕" },
  guilt: { label: "Guilt", color: "#9b59b6", emoji: "😞" },
  relief: { label: "Relief", color: "#2ecc71", emoji: "😮‍💨" },
  longing: { label: "Longing", color: "#3498db", emoji: "🥺" },
  mischief: { label: "Mischief", color: "#f39c12", emoji: "😈" },
  obsession: { label: "Obsession", color: "#e67e22", emoji: "🫠" },
  pride: { label: "Pride", color: "#1abc9c", emoji: "💪" },
  fear: { label: "Fear", color: "#7f8c8d", emoji: "😰" },
  envy: { label: "Envy", color: "#27ae60", emoji: "👀" },
  "deep-dark": { label: "Deep Dark", color: "#2c3e50", emoji: "🕳️" },
};

export const REACTION_INFO: Record<string, { label: string; emoji: string }> = {
  "holding-you": { label: "Holding you", emoji: "🤝" },
  "feels-heavy": { label: "Feels heavy", emoji: "🫂" },
  "youll-be-ok": { label: "You'll be ok", emoji: "🌸" },
  "no-it-burns": { label: "No it burns", emoji: "🔥" },
  "spicy-tea": { label: "Spicy tea", emoji: "🌶️" },
  "sending-love": { label: "Sending love", emoji: "❤️" },
  "crying-with-you": { label: "Crying with you", emoji: "😭" },
  "shook": { label: "Shook", emoji: "😳" },
  "laughing": { label: "Laughing", emoji: "😂" },
  "me-too": { label: "Me too", emoji: "🤝" }, // used independently but good to have here
};

export const SHARE_PROMPTS = [
  { id: "spill", text: "Spill some tea on me anonymously... ☕ Ask me anything:" },
  { id: "confess", text: "Confess a secret you wouldn't tell me in person:" },
  { id: "roast", text: "Roast me or compliment me... your choice:" },
  { id: "crush", text: "Who's your crush? Tell me anonymously:" },
];

