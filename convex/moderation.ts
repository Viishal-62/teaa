/**
 * ─── Content Moderation Utility ───
 * Shared moderation logic used by confessions, spills, and chapters.
 * Checks text against base banned words + board-custom banned words.
 * Returns detailed positions for frontend underlining.
 */

// ─── Base Banned Words ───
// These are always blocked across the entire platform
const STRICT_BANNED_WORDS = [
  // ─── Severe Slurs & Hate Speech ───
  "nigger",
  "nigga",
  "faggot",
  "tranny",
  "kike",
  "paki",
  "retard",
  "retarded",
  "spic",
  "chink",
  "wetback",
  "coon",
  "towelhead",
  "raghead",
  "gook",
  "dyke",

  // ─── Sexual Violence & Abuse ───
  "rape",
  "raping",
  "rapist",
  "molest",
  "molester",
  "pedophile",
  "pedo",

  // ─── Violence & Threats ───
  "murder",
  "murdering",
  "kill yourself",
  "kys",
  "suicide",
  "go die",
  "school shooting",
  "bomb threat",
  "hang yourself",
  "throat slit",
  "stab you",

  // ─── Illegal Content ───
  "child porn",
  "cp",
  "exploitation",
];

const COMMON_PROFANITY_WORDS = [
  // ─── Common Profanity (Broad Filter) ───
  "fuck",
  "fucking",
  "fucked",
  "fucker",
  "fuckface",
  "fuckstick",
  "f@ck",
  "f*ck",
  "shit",
  "shitting",
  "shitted",
  "shitter",
  "shithole",
  "sh*t",
  "s*it",
  "bitch",
  "bitching",
  "bitched",
  "bitchy",
  "b!tch",
  "b*tch",
  "ass",
  "asshole",
  "dumbass",
  "jackass",
  "asswipe",
  "arse",
  "cunt",
  "twat",
  "pussy",
  "dick",
  "cock",
  "penis",
  "vagina",
  "clit",
  "bastard",
  "motherfucker",
  "motherfucking",
  "son of a bitch",
  "whore",
  "slut",
  "skank",
  "prostitute",
  "hooker",
  "dickhead",
  "dipstick",
  "douche",
  "douchebag",
  "douchenozzle",
  "wanker",
  "bloody",
  "bollocks",
  "bugger",
  "tosser",

  // ─── Variations & Leetspeak ───
  "f u c k",
  "s h i t",
  "b i t c h",
  "c u n t",
  "f.u.c.k",
  "s.h.i.t",
  "b.i.t.c.h",
  "fck",
  "shit",
  "btch",
  "cnt",
];

export type FlaggedWord = {
  word: string; // The matched banned word
  start: number; // Start index in original text
  end: number; // End index in original text (exclusive)
};

export type ModerationResult = {
  isClean: boolean;
  flaggedWords: FlaggedWord[];
  message: string;
};

/**
 * Moderate a piece of text against the banned words list.
 * Returns detailed info about each flagged word including its position.
 */
export function moderateText(
  text: string,
  customBannedWords: string[] = [],
  options: { disableCommonProfanityFilter?: boolean } = {}
): ModerationResult {
  if (!text || text.trim().length === 0) {
    return { isClean: true, flaggedWords: [], message: "" };
  }

  const lowerText = text.toLowerCase();
  
  let baseWords = [...STRICT_BANNED_WORDS];
  if (!options.disableCommonProfanityFilter) {
    baseWords = [...baseWords, ...COMMON_PROFANITY_WORDS];
  }

  const allBanned = [
    ...baseWords,
    ...customBannedWords.map((w) => w.toLowerCase()),
  ];

  // Deduplicate
  const uniqueBanned = [...new Set(allBanned)].filter(
    (w) => w.trim().length > 0,
  );

  const flaggedWords: FlaggedWord[] = [];

  for (const bannedWord of uniqueBanned) {
    const escaped = bannedWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape regex
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");

    let match;

    while ((match = regex.exec(text)) !== null) {
      flaggedWords.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Sort by position and deduplicate overlapping ranges
  flaggedWords.sort((a, b) => a.start - b.start);
  const deduped = deduplicateRanges(flaggedWords);

  if (deduped.length === 0) {
    return { isClean: true, flaggedWords: [], message: "" };
  }

  const wordList = [...new Set(deduped.map((f) => f.word.toLowerCase()))];
  const message =
    wordList.length === 1
      ? "Your text contains a restricted word. Please remove it and try again."
      : `Your text contains ${wordList.length} restricted words. Please remove them and try again.`;

  return {
    isClean: false,
    flaggedWords: deduped,
    message,
  };
}

/**
 * Remove overlapping ranges — keep the longer match when ranges overlap.
 */
function deduplicateRanges(ranges: FlaggedWord[]): FlaggedWord[] {
  if (ranges.length === 0) return [];

  const result: FlaggedWord[] = [ranges[0]];

  for (let i = 1; i < ranges.length; i++) {
    const last = result[result.length - 1];
    const current = ranges[i];

    if (current.start < last.end) {
      // Overlap — keep the longer one
      if (current.end > last.end) {
        result[result.length - 1] = current;
      }
      // Otherwise skip (current is fully inside last)
    } else {
      result.push(current);
    }
  }

  return result;
}
