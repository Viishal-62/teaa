import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { generateAnonName, CATEGORIES } from "./helpers";

const GOSSIPS = [
  "I overheard the CEO talking about a major restructure next month. Half the marketing team is gone.",
  "Someone has been stealing lunches from the fridge, and I put a hidden camera. It’s the HR manager.",
  "I've been secretly dating my manager for the past 6 months. It's getting so hard to hide it at work.",
  "Saw two of our 'married' directors holding hands in the parking lot after hours. I'm taking this to my grave (except here).",
  "The new hire lied on their resume about knowing React. I've been secretly writing all their code for a cut of their salary.",
  "I accidentally saw the payroll spreadsheet. The guy who does nothing all day makes 2x what everyone else does.",
  "I'm the one who broke the coffee machine on purpose because people were spending too much time talking near my desk.",
  "I know for a fact that our biggest client is thinking of leaving us. The account managers are panicking.",
  "Our lead designer has been secretly outsourcing their work to someone on Fiverr. They just review and submit.",
  "At the company party, the quiet dev told me they have a crush on our product manager. It was so awkward.",
  "I actually created a fake anonymous account to agree with my own proposals in the company feedback channel.",
];

const ADMIRER_NOTES = [
  "To the girl in accounting with the green glasses: your laugh makes my day every time I hear it.",
  "I purposely walk past your desk just to smell your perfume. Is that creepy? I don't care.",
  "Every time we pair program, I forget how to code because I'm just staring at your eyes.",
  "You lent me your pen a year ago and I kept it. It's my lucky pen now.",
  "I always leave a slice of your favorite cake in the kitchen hoping you take it. You never do.",
  "I wish I had the courage to ask you out. Maybe at the next office party...",
  "Your presentation today was amazing. Too bad I was too distracted by your smile to listen to a word you said.",
  "I noticed you changed your hair. It looks beautiful.",
  "I matched with you on Tinder but panicked and unmatched. Now I have to see you every day.",
  "I know you don't even know my name, but you're the reason I haven't quit this job yet.",
];

const GENERAL_CONFESSIONS = [
  "Sometimes I just take my laptop to the bathroom and sleep for 20 minutes.",
  "I accidentally sent a meme mocking our client TO the client. Said I got hacked.",
  "I pretend I have 'internet issues' during standup so I don't have to talk.",
  "I have no idea what my job even is anymore. I just forward emails.",
  "I've been using ChatGPT to write all my performance reviews for my direct reports.",
];

const SPILLS_DATA = [
  {
    title: "The Missing Lunches & The HR Coverup",
    coverTheme: "chai-spill",
    coverEmoji: "📓",
    displayName: "Xoxo Gossip Girl",
    board: "juicy-gossips",
    chapters: [
      {
        title: "The Setup",
        text: "It all started when Dave's sandwich went missing. Little did we know, the HR manager had a secret mini-fridge under her desk. I caught her eating his turkey wrap and acting totally innocent.",
      },
      {
        title: "The Cover Up",
        text: "After the lunch incident, I started noticing payroll discrepancies. Let's just say she's been approving her own 'overtime' while browsing Pinterest for 4 hours a day...",
      },
    ],
  },
  {
    title: "The Marketing Team's Secret Discord",
    coverTheme: "noir",
    coverEmoji: "🔥",
    displayName: "The Whistleblower",
    board: "juicy-gossips",
    chapters: [
      {
        title: "Invited by Mistake",
        text: "I was accidentally sent a link to a Discord server meant only for the upper marketing team. What I found inside was wild.",
      },
      {
        title: "The Burn Book",
        text: "They have a dedicated channel roasting everyone's outfits and presentations. The VP of sales? They call him 'Sweaty Steve' and turn his Zoom faces into custom emojis. I have screenshots.",
      },
      {
        title: "The Resignations",
        text: "Now I understand why two of our best writers suddenly quit last month. It wasn't 'better opportunities,' it was this server.",
      },
    ],
  },
  {
    title: "The 'Married' Director's Midnight Meetings",
    coverTheme: "midnight-rose",
    coverEmoji: "🌙",
    displayName: "Night Owl",
    board: "office-affairs",
    chapters: [
      {
        title: "Late Night Code Deploy?",
        text: "I was working until 1 AM last Tuesday and decided to grab a coffee from the breakroom. The lights in the director's office were still on.",
      },
      {
        title: "The Discovery",
        text: "I peeked through the blinds. He and the new account executive were definitely NOT reviewing Q3 projections. I snuck out before they saw me.",
      },
    ],
  },
  {
    title: "The Fake Client Pitch That Won Us $2M",
    coverTheme: "moonlit",
    coverEmoji: "💼",
    displayName: "Guilty Exec",
    board: "office-affairs",
    chapters: [
      {
        title: "The Lie",
        text: "We were totally unprepared for the pitch meeting. We literally faked the entire prototype using un clickable images.",
      },
      {
        title: "The Panic",
        text: "When they asked to click a button, my boss 'accidentally' spilled coffee on his laptop. The client was so sympathetic they didn't even care.",
      },
      {
        title: "The Aftermath",
        text: "We got the contract. Now our engineering team is pulling 80-hour weeks trying to build what we faked. My conscience is killing me.",
      },
    ],
  },
];

function randomViews() {
  return Math.floor(Math.random() * 19) + 1; // 1 to 19 views
}

export const runSeed = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting seed process...");

    // 1. Create Boards
    const boardsToCreate = [
      {
        slug: "juicy-gossips",
        name: "Juicy Gossips",
        tagline: "Spill the tea. We won't tell.",
        theme: "chai-spill",
        boardType: "default",
        visibility: "public",
        creatorToken: "seed-token-123",
        createdAt: Date.now(),
      },
      {
        slug: "office-affairs",
        name: "Office Affairs",
        tagline: "What happens in the breakroom...",
        theme: "noir",
        boardType: "default",
        visibility: "public",
        creatorToken: "seed-token-456",
        createdAt: Date.now(),
      },
      {
        slug: "secret-admirers",
        name: "Company Crushes",
        tagline: "Tell them without telling them.",
        theme: "midnight-rose",
        boardType: "secret-admirer",
        visibility: "public",
        creatorToken: "seed-token-789",
        createdAt: Date.now(),
      },
    ];

    const boardIds: Record<string, any> = {};

    for (const b of boardsToCreate) {
      // Check if exists
      const existing = await ctx.db
        .query("boards")
        .withIndex("by_slug", (q) => q.eq("slug", b.slug))
        .first();

      if (existing) {
        boardIds[b.slug] = existing._id;
      } else {
        const id = await ctx.db.insert("boards", b);
        boardIds[b.slug] = id;
      }
    }

    // 2. Add Confessions
    let timeOffset = 0;
    const addConfession = async (
      boardSlug: string,
      text: string,
      catIdx: number,
      prefixStr: string,
    ) => {
      timeOffset += 1000 * 60 * 5; // 5 min apart
      const views = randomViews();
      const confId = await ctx.db.insert("confessions", {
        boardId: boardIds[boardSlug],
        type: "text",
        text,
        category:
          boardSlug === "secret-admirers"
            ? "secret-admirer"
            : CATEGORIES[catIdx % CATEGORIES.length],
        displayName: generateAnonName(),
        isGlobal: false,
        views,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7 + timeOffset, // Over the last week
        visitorId: "seed-visitor-" + Math.floor(Math.random() * 1000),
      });

      // Add reactions (less than views)
      const numReactions = Math.floor(Math.random() * (views - 1)); // if views=5, reactions max 4
      const types = [
        "holding-you",
        "feels-heavy",
        "youll-be-ok",
        "no-it-burns",
      ];
      for (let i = 0; i < numReactions; i++) {
        await ctx.db.insert("reactions", {
          confessionId: confId,
          type: types[i % types.length],
          visitorId: "seed-reactor-" + i,
          createdAt: Date.now() - 1000 * 60 * 60 * 24 + i * 1000,
        });
      }

      // Add maybe 1 comment sometimes
      if (Math.random() > 0.7) {
        await ctx.db.insert("comments", {
          confessionId: confId,
          text: "Omg this is " + prefixStr,
          displayName: generateAnonName(),
          visitorId: "seed-commenter",
          createdAt: Date.now() - 1000 * 60 * 60 * 12,
        });
      }
    };

    // Insert gossips
    for (const [i, g] of GOSSIPS.entries()) {
      await addConfession("juicy-gossips", g, i, "wild 🤯");
    }

    // Insert office affairs
    for (const [i, g] of GENERAL_CONFESSIONS.entries()) {
      await addConfession("office-affairs", g, i + 5, "so true lol");
    }

    // Insert admirer notes
    for (const [i, n] of ADMIRER_NOTES.entries()) {
      await addConfession("secret-admirers", n, i + 1, "cute ❤️");
    }

    // 3. Add Spills (Deep Gossip Books)
    for (const spill of SPILLS_DATA) {
      const views = randomViews();
      const spillId = await ctx.db.insert("spills", {
        boardId: boardIds[spill.board],
        title: spill.title,
        coverTheme: spill.coverTheme,
        coverEmoji: spill.coverEmoji,
        generationsUsed: 0,
        displayName: spill.displayName,
        views: views,
        createdAt: Date.now() - 1000 * 60 * 60 * (Math.random() * 72 + 24),
      });

      let chapterTimeOffset = 1000 * 60 * 60; // chapters posted 1 hour apart
      for (const [i, chapter] of spill.chapters.entries()) {
        await ctx.db.insert("chapters", {
          spillId: spillId,
          chapterNumber: i + 1,
          title: chapter.title,
          text: chapter.text,
          createdAt: Date.now() - 1000 * 60 * 60 * 48 + i * chapterTimeOffset,
        });
      }

      // Add a reaction or two (less than views)
      const spillReactions = ["fire", "mind-blown", "tea", "crying"];
      const r_count =
        Math.floor(Math.random() * (views > 1 ? views - 1 : 1)) + 1;
      for (let j = 0; j < Math.min(r_count, 4); j++) {
        await ctx.db.insert("spillReactions", {
          spillId: spillId,
          type: spillReactions[
            Math.floor(Math.random() * spillReactions.length)
          ],
          visitorId: "seed-spill-reactor-" + j,
          createdAt: Date.now() - 1000 * 60 * 60 * 10 + j * 1000,
        });
      }
    }

    console.log("Seed data created successfully!");
  },
});
