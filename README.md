# 🫖 Teaaa — Anonymous Confession Platform

A modern, anonymous confession platform where people can create boards, share links, and receive anonymous confessions. Built with Next.js 16, Convex, and TailwindCSS 4.

> **No sign‑up. No trace. Just truth.**

---

## ✨ Features

### Core
- **Anonymous Confessions** — Post confessions without any account or sign-up
- **Confession Boards** — Create themed boards and share links to collect anonymous confessions
- **Global Feed** — A universal confession feed for everyone
- **Category System** — 11 confession categories: Regret, Love, Guilt, Relief, Longing, Mischief, Obsession, Pride, Fear, Envy, Deep Dark

### UI / UX
- **3D Coverflow Carousel** — Interactive card carousel with:
  - Trackpad / mousewheel scroll navigation
  - Keyboard arrow key support (← → ↑ ↓)
  - Click-to-jump on side cards
  - Centered start position (cards balanced on both sides)
- **Flip Cards** — Tap to reveal confession text, reactions, and comments on the back
- **Theme System** — 6 visual themes for confession cards (Midnight Rose, Moonlit, Forest Whisper, Violet Hour, Noir, Chai Spill)
- **Clean White Design** — Minimalist cream/white (`#faf8f5`) aesthetic throughout

### Interactions
- **Reactions** — 4 reaction types: "Holding You", "Feels Heavy", "You'll Be OK", "No It Burns"
- **Comments** — Anonymous threaded comments on confessions
- **GIF Replies** — Reply with GIFs via Tenor integration (search + trending)
- **Emoji Picker** — Emoji support in comments
- **Visitor Tracking** — localStorage-based fingerprinting for reaction uniqueness (no accounts)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Backend / DB** | Convex (real-time, serverless) |
| **Styling** | TailwindCSS 4 (`@theme inline`) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Emoji** | emoji-mart |
| **GIFs** | Tenor API (v2) |
| **Linting** | Biome |
| **Package Manager** | pnpm |

---

## 📁 Project Structure

```
teaaa/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Design tokens + utilities
│   ├── ConvexClientProvider.tsx     # Convex provider wrapper
│   ├── create/page.tsx             # Create board page
│   ├── confess/page.tsx            # Global confess page
│   ├── explore/page.tsx            # Explore all confessions + boards
│   ├── b/[slug]/                   # Board pages
│   │   ├── page.tsx                # Board view with carousel
│   │   ├── confess/page.tsx        # Board-specific confess page
│   │   └── c/[confessionId]/page.tsx  # Confession detail (reactions + comments)
│   ├── components/
│   │   ├── ConfessionFlipCard.tsx   # 3D flip card component
│   │   ├── EmojiPicker.tsx         # Emoji picker wrapper
│   │   └── GifPicker.tsx           # Tenor GIF picker
│   └── lib/
│       └── utils.ts                # Utilities, constants, helpers
├── convex/
│   ├── schema.ts                   # Database schema
│   ├── boards.ts                   # Board mutations/queries
│   ├── confessions.ts              # Confession mutations/queries
│   ├── reactions.ts                # Reaction mutations/queries
│   ├── comments.ts                 # Comment mutations/queries
│   └── helpers.ts                  # Anonymous name generator
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd teaaa

# Install dependencies
pnpm install

# Set up Convex (follow prompts to create a project)
npx convex dev

# Start the dev server
pnpm run dev
```

### Environment Variables

Create a `.env.local` file:

```env
CONVEX_DEPLOYMENT=<your-convex-deployment>
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
```

### Development

Run both servers simultaneously:

```bash
# Terminal 1 — Convex backend
pnpm run db

# Terminal 2 — Next.js frontend
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📄 Database Schema

| Table | Purpose |
|-------|---------|
| **boards** | Confession boards with slug, name, tagline, theme, visibility |
| **confessions** | Anonymous confessions linked to boards with category and display name |
| **reactions** | Visitor-based reactions on confessions (4 types) |
| **comments** | Anonymous comments on confessions with optional GIF support |

---

## 🧭 User Flow

1. **Landing** → Hero + blurred confession previews + CTA
2. **Create Board** → Pick name, tagline, theme → Get shareable link
3. **Share Link** → Friends open the board link
4. **Confess** → Pick category, write confession → Submit anonymously
5. **Explore** → 3D carousel of all confessions, filter by category
6. **Interact** → Flip cards to reveal, react, comment, reply with GIFs

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server |
| `pnpm run db` | Start Convex dev server |
| `pnpm build` | Build for production |
| `pnpm lint` | Run Biome linter |
| `pnpm format` | Format code with Biome |

---

## 📝 License

MIT

---

<p align="center">
  Built with 🫖 and anonymous courage
</p>
