import { internalMutation } from "./_generated/server";
import { generateAnonName, CATEGORIES } from "./helpers";

const CITIES = [
  // India — heavy
  "BENGALURU", "MUMBAI", "DELHI_NCR", "PUNE", "HYDERABAD", "CHENNAI", "GURUGRAM", "NOIDA",
  "JAIPUR", "LUCKNOW", "KOCHI", "INDORE", "AHMEDABAD", "CHANDIGARH", "KOLKATA", "BHOPAL",
  "COIMBATORE", "NAGPUR", "VIZAG", "THIRUVANANTHAPURAM", "MYSURU", "SURAT", "VADODARA",
  "DEHRADUN", "RANCHI", "PATNA", "GUWAHATI", "BHUBANESWAR", "MANGALORE", "TRIVANDRUM",
  // US
  "SAN_FRANCISCO", "NEW_YORK", "AUSTIN", "SEATTLE", "CHICAGO", "BOSTON",
];

const PROFESSIONS = [
  "SDE", "FOUNDER", "PRODUCT_MANAGER", "STUDENT", "DESIGNER", "HR", "CONSULTANT",
  "DATA_SCIENTIST", "INVESTMENT_BANKER", "MARKETING", "BARISTA", "CONTENT_CREATOR",
  "FREELANCER", "CA", "DOCTOR", "LAWYER", "MBA_STUDENT", "ANALYST",
];

const CONTEXTS = [
  "COWORKER", "EX", "MANAGER", "STARTUP_BRO", "ROOMMATE", "CRUSH", "INTERVIEWER",
  "SITUATIONSHIP", "BEST_FRIEND", "MATCH", "CLIENT", "PROFESSOR", "COFOUNDER",
  "FLATMATE", "SENIOR", "JUNIOR", "BATCHMATE", "GYM_CRUSH", "TINDER_DATE",
];

export const GOSSIP_DATA = [
  "bro there's this guy on our floor who charges freshers 5k for a referral and calls it 'mentorship'… someone needs to call him out",
  "someone in our office microwaves fish every single friday. i sent that aggressive message on general. not sorry",
  "caught my coworker putting his own UPI QR over the chai wala's tip jar. absolute menace energy",
  "our design lead bills clients 10k/hr but outsources everything to a fiverr guy for 500 bucks lmaooo",
  "the office plant didn't die because of AC bro. i've been dumping my cold coffee into it for 3 months because the sink is too far",
  "there's a senior who marks 'busy' on slack every friday 2pm. matched with him on bumble. his location updates to a golf course. every. single. week.",
  "two people from different teams always take lunch at exactly the same time and sit in the same corner. 'just friends' sure okay",
  "someone's been stealing red bulls from the common fridge. i started writing fake names on mine. 'Property of CEO'. hasn't been touched since",
  "one guy on my team has 'Available' on slack 24/7 but has literally never replied to a single message before noon",
  "my manager's 'quick 5 min sync' has never been under 45 minutes. not once. i've started timing them",
  "there's a girl who comes to office only on days when there's free food from admin. the attendance pattern is sus af",
  "somebody changed their linkedin title to 'Senior' and started speaking differently in standups the very next day. we all noticed dude",
  "HR sent a 'culture survey' and someone wrote 'the culture is leaving at 6 and getting pinged at 9'. they never shared the results",
  "my team lead takes credit for everything in the all-hands but can't even open the repo without help",
  "pretty sure two interns are dating. they always 'happen to be' in the same meeting room for 'discussion'. the room has glass walls btw",
  "someone created a fake slack account called 'Anonymous HR Complaint' and management has been panicking for a week trying to find who it is",
  "our CEO said 'we're family here' right before announcing that 12 people are getting fired. the audacity",
  "the parking lot tells you everything. certain cars always leave at 5:01. certain cars are still there at midnight. choose your fighter",
  "found out the 'anonymous' feedback form isn't actually anonymous. my manager mentioned something i wrote word for word. never filling that out again",
  "there's a guy who replies 'great point' in every meeting but has never actually contributed an idea himself",
];

export const STARTUP_HORROR_DATA = [
  "our 'AI-powered algorithm' is literally 3 interns matching Excel columns manually. we just raised 10 crores on this lie btw",
  "CTO hasn't pushed code in 2 years. he runs npm install occasionally and calls it 'infrastructure work'",
  "we spent 8 lakhs on a rebrand. the new logo is literally the old logo in lowercase. i wish i was joking",
  "founder told us 'unlimited PTO'. i took 1 week off for my sister's wedding. got called into a 'performance discussion' when i came back",
  "our product doesn't work on mobile. 70% of our users are on mobile. nobody wants to talk about this",
  "they keep saying 'we're pre-revenue by choice'. bro you've been trying to sell for 2 years. it's not a choice anymore",
  "had a 2 hour 'brainstorming session'. the only outcome was scheduling another brainstorming session",
  "our slack has a channel called #wins. last message was 4 months ago",
  "my manager said 'think of it as an opportunity' when they asked me to do 3 people's work after layoffs. my salary didn't change",
  "we demo'd a feature to investors that straight up didn't work. the CEO was clicking pre-recorded screenshots. i wanted to disappear",
  "the 'co-founder' is the CEO's childhood friend who handles 'vibes and culture'. his actual job is ordering lunch on swiggy",
  "our standup takes 45 min because the founder uses it as therapy to vent about competitors",
  "someone asked about ESOP vesting in the all-hands and the founder laughed nervously and changed the topic. never answered",
  "we've been 'two weeks from launch' for the past five months now",
  "there's a 'no meeting wednesday' policy. my calendar has 4 meetings every wednesday. nobody cares",
  "i found production env variables committed to a public github repo. told the CTO. he said 'it's fine nobody checks'. bro WHAT",
  "founder posts motivational linkedin content about hustle culture while we haven't been paid on time in 3 months",
  "our company values poster says 'transparency' but nobody knows what the burn rate is or when we run out of money",
];

export const TOXIC_DATING_DATA = [
  "he literally borrowed my scooty to pick up another girl. and then asked me for petrol money the next day. THE AUDACITY",
  "matched on hinge, met at that overpriced cafe in koramangala, he trauma-dumped for 2 hours about his failed startup. hasn't texted since. watches all my stories though",
  "he said he couldn't reply last night because 'server was down at work'… bro you're a marketing intern. what server",
  "his bumble bio says 'looking for something real' but he's literally seeing 4 people. i know because 2 of them are my friends",
  "went on a date and he spent 40 minutes explaining crypto to me. i have a CS degree. from a better college than his. but sure, explain blockchain to me",
  "he ghosted me for 2 months then replied to my story saying 'that biryani looks mid'. BLOCKED",
  "found out he has a whole girlfriend when she commented 'love you baby' on the exact post where he's wearing the shirt I BOUGHT HIM",
  "he told me he's a 'founder'. checked linkedin — he's selling MLM supplements. we are not the same",
  "we were texting everyday for 3 weeks, made plans to meet, then on the day he said 'something came up' and he's been 'busy' ever since. it's been 2 months bro just say it",
  "he said 'i'm not looking for anything serious rn' but then got into a relationship 2 weeks later. with someone from my own friend circle. awesome",
  "caught him on hinge while we were literally sitting next to each other watching a movie. his excuse? 'i forgot to delete it'. his profile said 'active today'",
  "he told me he's 'intimidating' because i make more money than him. sorry for having a job??",
  "my ex still uses my netflix. i keep changing his profile language to tamil. he doesn't know tamil. i do this every time he brings a new girl home",
  "he said 'you're the only one' and i wanted to believe it but then his phone buzzed with 'goodnight baby 🥰' from someone saved as 'Gym Trainer'",
  "went on 3 amazing dates. introduced me to his friends. then one day just stopped replying. no fight, no reason, nothing. just gone. it's been 6 months and i still don't know what happened",
];

export const COLLEGE_DATA = [
  "my roommate has been using my face wash for a whole semester and refilling it with water. my skin has been acting up and NOW I KNOW WHY",
  "caught my professor googling the answer to a doubt i asked. live. on the projector. the whole class saw it. he pretended nothing happened",
  "paid a guy 2000 rs to write my assignment. he submitted it as 'ChatGPT_Assignment_Final_v2.docx'. i got called to the HOD's office",
  "there's this guy who sits in the 3rd row library every morning reading. i purposely drop my pen near him hoping he'll talk to me. semester's almost over and nothing has happened",
  "someone made a fake instagram ID just to post memes about our strict professor. the page has more followers than the college's official account now",
  "my roommate talks in his sleep. full conversations. last night he was negotiating a salary. IN HIS SLEEP. asked for 25 LPA btw. respect the ambition",
  "found out the class topper has a whole notion setup to track everyone's GPAs and ranks. she updates it after every exam. with color coding. i'm scared",
  "the wifi password is supposed to be secret but literally the entire hostel knows it because one guy wrote it on the bathroom wall with a sharpie",
  "group project of 5. i did everything. presentation day, 4 of them couldn't even explain their own 'section'. one of them opened the PPT for the first time ON STAGE",
  "there's a couple in our batch who broke up and got back together 7 times this semester. we've been counting. the groupchat has a scorecard",
  "our mess food is so bad someone started a google review page for it. it currently has 1.2 stars",
  "my lab partner copies EVERYTHING but somehow gets better grades because his 'handwriting is neater'. the system is rigged honestly",
  "someone played dhol beats from their room at 3am during exam week. nobody complained because honestly we all needed that energy",
  "the library has a 'quiet zone' but it's basically a dating spot after 8pm. the librarian gave up enforcing it",
  "our college fest budget was 15 lakhs. the wifi still doesn't work in the hostel. priorities right",
];

const ADMIRER_DATA = [
  "you lent me your charger in the library last sem and i kept it. it's my lucky charger now. i think about returning it as an excuse to talk to you but i never do",
  "i always leave the last gulab jamun in the mess for you because i noticed you always eat it. you probably think the mess is generous. it's just me",
  "your code reviews destroy me but your smile when you approve my PR makes it all worth it honestly",
  "i noticed you changed your glasses frame. third row, morning lecture. yes i noticed. it looks really good btw",
  "i matched with you on bumble but unmatched immediately because we work on the same floor. now i see you at the coffee machine every morning and i wanna die",
  "to the girl who listens to deftones in the 9am DSA lecture — you're the only reason i wake up on time. please never switch to earphones",
  "i wear that perfume you once said smells nice even though i actually hate it. every single day. for you",
  "you always hold the door open for everyone. nobody else does. i look forward to entering the office after you just for that 2 second interaction",
  "i know your coffee order by heart. iced americano, no sugar, extra shot. one day i'll have the guts to buy it for you",
  "you laughed at my joke in the standup once. i have been trying to be funny in every standup since. my manager thinks i'm not taking work seriously but i'm just trying to impress you",
];

// Long Form Spills
const SPILLS_DATA = [
  {
    title: "The Referral Mafia ✨",
    coverTheme: "neon",
    coverEmoji: "💸",
    displayName: "Angry Dev",
    board: "juicy-gossips",
    chapters: [
      {
        title: "The Price Tag",
        text: "So there's this guy at a top tier product-based company. I reached out on LinkedIn asking for advice and a referral for a junior SDE role. He was super nice at first, setup a 15-min call, gave me standard resume advice.",
      },
      {
        title: "The 'Mentorship' Fee",
        text: "Then he drops the bomb. He says he provides 'priority referrals' but it requires buying his 'mentorship package' which is literally ₹5000 per referral. If you don't pay, he ghosts you.",
      },
      {
        title: "The Reality",
        text: "I later found out he's doing this to hundreds of desperate freshers every month. He's probably making more from his fake 'referral ring' than his actual salary. People are so predatory in this market.",
      },
    ],
  },
  {
    title: "The Phantom Co-Founder",
    coverTheme: "noir",
    coverEmoji: "🤡",
    displayName: "Burnt Out Engineer",
    board: "startup-horror",
    chapters: [
      {
        title: "The Genius CTO",
        text: "I joined this hyped stealth startup. The CEO kept talking about his mysterious 'Genius CTO cofounder' who worked async from Europe and was building our core AI architecture.",
      },
      {
        title: "The Git History",
        text: "3 months in, I was tasked with integrating the API. I checked the commit history. The 'CTO' was pushing code entirely authored by ChatGPT. Not like, using copilot. Like literal 'As an AI language model, here is your function' comments left in the codebase.",
      },
      {
        title: "The Ultimate Pivot",
        text: "Turns out the CEO invented the CTO to look better to VCs because solo-founders get less funding. The 'European' IP address was just his VPN. We just raised $2M on a lie. I'm taking my equity and running.",
      },
    ],
  },
  {
    title: "The AirBnB Disaster",
    coverTheme: "midnight-rose",
    coverEmoji: "🐍",
    displayName: "Heartbroken Match",
    board: "toxic-dating",
    chapters: [
      {
        title: "The Weekend Getaway",
        text: "We had been dating for 4 months. He surprised me by booking an incredible AirBnB in the mountains for our anniversary. I was so excited, packed my nicest outfits. Everything was perfect until the first night.",
      },
      {
        title: "The Notification",
        text: "He left his iPad open on the counter while showering. An iMessage popped up from 'Mom' saying: 'Is she gone yet? What time can I come over?'. I thought that was weird. Why would his mom come to our romantic cabin at 11 PM?",
      },
      {
        title: "The Truth",
        text: "I opened it. 'Mom' was his long term girlfriend of 3 years. He had told her he was out of town for a 'conference', but had actually booked the cabin for BOTH of us on overlapping days. He was planning to fake an 'emergency' to send me home early so she could drive up for the weekend. I took his keys and drove his car back to the city.",
      },
    ]
  }
];

function randomViews() {
  return Math.floor(Math.random() * 89) + 12;
}

function getRandomItem(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate a random timestamp between 0 and 72 hours ago (within last 3 days)
function getRandomRecentDate() {
  const threeDaysInMs = 1000 * 60 * 60 * 24 * 3;
  const randomOffset = Math.floor(Math.random() * threeDaysInMs);
  return Date.now() - randomOffset;
}

export const runSeed = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting hyper-realistic, massive seed process...");

    // 0. Wipe DB completely
    const clearTable = async (tableName: any) => {
      const docs = await ctx.db.query(tableName).collect();
      await Promise.all(docs.map((d: any) => ctx.db.delete(d._id)));
    };

    console.log("Wiping existing data...");
    await clearTable("comments");
    await clearTable("reactions");
    await clearTable("confessions");
    await clearTable("chapters");
    await clearTable("spillReactions");
    await clearTable("spills");
    await clearTable("boards");
    console.log("Data wiped successfully.");

    // 1. Create Boards
    const boardsToCreate = [
      {
        slug: "juicy-gossips",
        name: "Juicy Gossips",
        tagline: "Spill the tea. We won't tell.",
        theme: "chai-spill",
        boardType: "default",
        visibility: "public",
        creatorToken: "seed-gen-1",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
      },
      {
        slug: "startup-horror",
        name: "Startup Horrors",
        tagline: "Venting about toxic founders & VC drama.",
        theme: "noir",
        boardType: "default",
        visibility: "public",
        creatorToken: "seed-gen-2",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
      {
        slug: "toxic-dating",
        name: "Toxic Dating Files",
        tagline: "Red flags, ghosting, and situationships.",
        theme: "midnight-rose",
        boardType: "default",
        visibility: "public",
        creatorToken: "seed-gen-3",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
      {
        slug: "college-confessions",
        name: "College Confessions",
        tagline: "Exam stress and roommate wars.",
        theme: "matcha-spill",
        boardType: "default",
        visibility: "public",
        creatorToken: "seed-gen-4",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
      },
      {
        slug: "secret-admirers",
        name: "Company Crushes",
        tagline: "Tell them without telling them.",
        theme: "midnight-rose",
        boardType: "secret-admirer",
        visibility: "public",
        creatorToken: "seed-gen-5",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
      },
    ];

    const boardIds: Record<string, any> = {};

    for (const b of boardsToCreate) {
      const id = await ctx.db.insert("boards", b);
      boardIds[b.slug] = id;
    }

    // 2. Add Confessions Helper
    const addConfession = async (
      boardSlug: string,
      text: string,
      catIdx: number,
      prefixStr: string,
    ) => {
      const views = randomViews();
      const createdAt = getRandomRecentDate(); // Random date within last 72 hours

      const cityId = Math.random() > 0.1 ? getRandomItem(CITIES) : undefined;
      const professionId = Math.random() > 0.1 ? getRandomItem(PROFESSIONS) : undefined;
      const contextId = Math.random() > 0.1 ? getRandomItem(CONTEXTS) : undefined;

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
        cityId,
        professionId,
        contextId,
        createdAt: createdAt,
        visitorId: "seed-visitor-" + Math.floor(Math.random() * 10000),
      });

      // Add reactions slightly after confession created
      const numReactions = Math.floor(Math.random() * (views - 1));
      const types = ["holding-you", "feels-heavy", "youll-be-ok", "no-it-burns"];
      for (let i = 0; i < numReactions; i++) {
        await ctx.db.insert("reactions", {
          confessionId: confId,
          type: types[i % types.length],
          visitorId: "seed-reactor-" + i,
          createdAt: createdAt + 1000 * 60 * (i + 1) * 5, // 5 mins later
        });
      }

      // Add maybe 1 comment
      if (Math.random() > 0.6) {
        await ctx.db.insert("comments", {
          confessionId: confId,
          text: prefixStr,
          displayName: generateAnonName(),
          visitorId: "seed-commenter",
          createdAt: createdAt + 1000 * 60 * 60 * 2, // 2 hours later
        });
      }
    };

    // Insert gossips
    for (const [i, g] of GOSSIP_DATA.entries()) {
      await addConfession("juicy-gossips", g, i, "LMAO this is way too accurate 😭");
    }

    // Insert startup horrors
    for (const [i, g] of STARTUP_HORROR_DATA.entries()) {
      await addConfession("startup-horror", g, i + 3, "I feel seen. This is literally me.");
    }

    // Insert toxic dating
    for (const [i, g] of TOXIC_DATING_DATA.entries()) {
      await addConfession("toxic-dating", g, i + 5, "Men are a disease honestly.");
    }

    // Insert college confessions
    for (const [i, g] of COLLEGE_DATA.entries()) {
      await addConfession("college-confessions", g, i + 2, "Report the professor to the dean ASAP.");
    }

    // Insert admirer notes
    for (const [i, n] of ADMIRER_DATA.entries()) {
      await addConfession("secret-admirers", n, i + 1, "If someone wrote this about me I would actually cry.");
    }

    // 3. Add Spills (Deep Gossip Books)
    for (const spill of SPILLS_DATA) {
      const views = randomViews();
      const spillCreatedAt = getRandomRecentDate();

      const spillId = await ctx.db.insert("spills", {
        boardId: boardIds[spill.board],
        title: spill.title,
        coverTheme: spill.coverTheme,
        coverEmoji: spill.coverEmoji,
        generationsUsed: 0,
        displayName: spill.displayName,
        views: views,
        createdAt: spillCreatedAt,
      });

      for (const [i, chapter] of spill.chapters.entries()) {
        await ctx.db.insert("chapters", {
          spillId: spillId,
          chapterNumber: i + 1,
          title: chapter.title,
          text: chapter.text,
          createdAt: spillCreatedAt + (1000 * 60 * 60 * i), // Each chapter 1 hr later
        });
      }

      const spillReactions = ["fire", "mind-blown", "tea", "crying"];
      const r_count = Math.floor(Math.random() * (views > 1 ? views - 1 : 1)) + 1;
      for (let j = 0; j < Math.min(r_count, 4); j++) {
        await ctx.db.insert("spillReactions", {
          spillId: spillId,
          type: spillReactions[Math.floor(Math.random() * spillReactions.length)],
          visitorId: "seed-spill-reactor-" + j,
          createdAt: spillCreatedAt + 1000 * 60 * 30 * j,
        });
      }
    }

    console.log("Hyper-realistic MASSSIVE Seed data created successfully, old data wiped!");
  },
});
