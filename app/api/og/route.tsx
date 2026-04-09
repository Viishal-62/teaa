import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") || "board";
  const slug = searchParams.get("slug");
  const id = searchParams.get("id");

  try {
    if (type === "spill" && id) {
      return await renderSpillOG(id);
    }
    if (type === "confession" && id) {
      return await renderConfessionOG(id);
    }
    if (type === "admirers" && slug) {
      return await renderAdmirersOG(slug);
    }
    if (type === "create-spill" && slug) {
      return await renderCreateSpillOG(slug);
    }
    if (type === "poll" && slug) {
      return await renderPollOG(slug);
    }
    if (type === "board" && slug) {
      return await renderBoardOG(slug);
    }
    return renderDefaultOG();
  } catch {
    return renderDefaultOG();
  }
}

// ─── Category Colors ───
const CATEGORY_COLORS: Record<string, { color: string; label: string }> = {
  regret: { color: "#e74c3c", label: "Regret" },
  love: { color: "#e91e63", label: "Love" },
  guilt: { color: "#9b59b6", label: "Guilt" },
  relief: { color: "#2ecc71", label: "Relief" },
  longing: { color: "#3498db", label: "Longing" },
  mischief: { color: "#f39c12", label: "Mischief" },
  obsession: { color: "#e67e22", label: "Obsession" },
  pride: { color: "#1abc9c", label: "Pride" },
  fear: { color: "#7f8c8d", label: "Fear" },
  envy: { color: "#27ae60", label: "Envy" },
  "deep-dark": { color: "#2c3e50", label: "Deep Dark" },
};

// ─── Confession OG Image ───
async function renderConfessionOG(confessionId: string) {
  const confession = await fetchQuery(api.confessions.getById, {
    confessionId: confessionId as any,
  });

  if (!confession) return renderDefaultOG();

  const cat = CATEGORY_COLORS[confession.category];
  const safeText =
    typeof confession.text === "string" && confession.text.trim().length > 0
      ? confession.text
      : confession.type === "voice"
        ? "Voice confession"
        : "Anonymous confession";
  const truncatedText =
    safeText.length > 200 ? `${safeText.slice(0, 200)}...` : safeText;

  return new ImageResponse(
    <div
      style={{
        width: "1200",
        height: "630",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #faf7f2 0%, #f0ebe3 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: "-50",
          right: "-50",
          width: "300",
          height: "300",
          borderRadius: "50%",
          background: `${cat?.color ?? "#8b2252"}10`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-80",
          left: "-80",
          width: "400",
          height: "400",
          borderRadius: "50%",
          background: `${cat?.color ?? "#8b2252"}08`,
        }}
      />

      {/* Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: "800",
          padding: "60px 50px",
          background: "white",
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        {/* Category badge */}
        {cat && (
          <div
            style={{
              display: "flex",
              fontSize: "14px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: cat.color,
              background: `${cat.color}12`,
              padding: "6px 18px",
              borderRadius: "100px",
              marginBottom: "24px",
            }}
          >
            {cat.label}
          </div>
        )}

        {/* Teapot */}
        <div
          style={{ fontSize: "36px", marginBottom: "16px", display: "flex" }}
        >
          🫖
        </div>

        {/* Text */}
        <div
          style={{
            fontSize: "28px",
            lineHeight: 1.6,
            color: "#2a2a2a",
            textAlign: "center",
            display: "flex",
          }}
        >
          &ldquo;{truncatedText}&rdquo;
        </div>

        {/* Display name */}
        <div
          style={{
            fontSize: "14px",
            color: "rgba(0,0,0,0.3)",
            marginTop: "24px",
            fontStyle: "italic",
            display: "flex",
          }}
        >
          — {confession.displayName}
        </div>
      </div>

      {/* Bottom brand */}
      <div
        style={{
          position: "absolute",
          bottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "16px",
          fontWeight: 700,
          color: "rgba(0,0,0,0.2)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        🫖 Teaaa — Spill it anonymously
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}

// ─── Board OG Image ───
async function renderBoardOG(slug: string) {
  const board = await fetchQuery(api.boards.getBySlug, { slug });
  if (!board) return renderDefaultOG();

  return new ImageResponse(
    <div
      style={{
        width: "1200",
        height: "630",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #faf7f2 0%, #f0ebe3 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Decorative */}
      <div
        style={{
          position: "absolute",
          top: "-100",
          left: "-100",
          width: "400",
          height: "400",
          borderRadius: "50%",
          background: "rgba(209,61,61,0.06)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-60",
          right: "-60",
          width: "300",
          height: "300",
          borderRadius: "50%",
          background: "rgba(209,61,61,0.04)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{ fontSize: "64px", marginBottom: "16px", display: "flex" }}
        >
          🫖
        </div>
        <div
          style={{
            fontSize: "52px",
            fontWeight: 900,
            color: "#111",
            letterSpacing: "-0.02em",
            marginBottom: "12px",
            display: "flex",
          }}
        >
          {board.name}
        </div>
        {board.tagline && (
          <div
            style={{
              fontSize: "22px",
              color: "rgba(0,0,0,0.4)",
              fontStyle: "italic",
              marginBottom: "32px",
              display: "flex",
            }}
          >
            &ldquo;{board.tagline}&rdquo;
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(0,0,0,0.05)",
            padding: "12px 28px",
            borderRadius: "100px",
            fontSize: "16px",
            fontWeight: 700,
            color: "rgba(0,0,0,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Tap to spill your secrets anonymously
        </div>
      </div>

      {/* Bottom branding */}
      <div
        style={{
          position: "absolute",
          bottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "16px",
          fontWeight: 700,
          color: "rgba(0,0,0,0.15)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        Teaaa — Anonymous Confessions
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}

// ─── Spill OG Image ───
async function renderSpillOG(spillId: string) {
  const spill = await fetchQuery(api.spills.getById, {
    spillId: spillId as any,
  });

  if (!spill) return renderDefaultOG();

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Background glow effects */}
      <div
        style={{
          position: "absolute",
          top: "-150px",
          left: "-150px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, rgba(0,0,0,0) 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-150px",
          right: "-150px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0,0,0,0) 70%)",
        }}
      />

      {/* Book Cover Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "800px",
          height: "500px",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          padding: "40px",
        }}
      >
        {/* Emoji Cover */}
        <div style={{ fontSize: "100px", marginBottom: "20px", display: "flex", filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.3))" }}>
          {spill.coverEmoji || "📔"}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "30px",
            display: "flex",
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          {spill.title.length > 50 ? `${spill.title.slice(0, 50)}...` : spill.title}
        </div>

        {/* Author Line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "rgba(255,255,255,0.06)",
            padding: "12px 24px",
            borderRadius: "100px",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ fontSize: "20px", display: "flex" }}>✍️</div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.8)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            By {spill.displayName}
          </div>
        </div>
      </div>

      {/* Brand Watermark */}
      <div
        style={{
          position: "absolute",
          bottom: "30px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div style={{ fontSize: "24px", display: "flex" }}>🫖</div>
        <div
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Teaaa Deep Spills
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}

// ─── Admirers OG Image ───
async function renderAdmirersOG(slug: string) {
  const board = await fetchQuery(api.boards.getBySlug, { slug });
  if (!board) return renderDefaultOG();

  return new ImageResponse(
    <div
      style={{
        width: "1200",
        height: "630",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #2a0845 0%, #6441A5 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-150",
          left: "-150",
          width: "500",
          height: "500",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(233, 30, 99, 0.4) 0%, rgba(0,0,0,0) 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-150",
          right: "-150",
          width: "500",
          height: "500",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(156, 39, 176, 0.4) 0%, rgba(0,0,0,0) 70%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255, 255, 255, 0.1)",
          padding: "60px 80px",
          borderRadius: "32px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <div style={{ fontSize: "72px", marginBottom: "24px", display: "flex" }}>
          💌
        </div>
        <div
          style={{
            fontSize: "64px",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            marginBottom: "16px",
            display: "flex",
            textAlign: "center",
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          Secret Admirers
        </div>
        <div
          style={{
            fontSize: "32px",
            color: "rgba(255,255,255,0.8)",
            fontStyle: "italic",
            marginBottom: "32px",
            display: "flex",
            textAlign: "center",
          }}
        >
          of {board.name}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "rgba(0,0,0,0.4)",
            padding: "16px 32px",
            borderRadius: "100px",
            fontSize: "20px",
            fontWeight: 700,
            color: "rgba(255,255,255,0.9)",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          Drop a hidden whisper
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}

// ─── Create Spill OG Image ───
async function renderCreateSpillOG(slug: string) {
  const board = await fetchQuery(api.boards.getBySlug, { slug });
  if (!board) return renderDefaultOG();

  return new ImageResponse(
    <div
      style={{
        width: "1200",
        height: "630",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #111111 0%, #000000 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-50",
          right: "-50",
          width: "400",
          height: "400",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, rgba(0,0,0,0) 70%)",
        }}
      />
      
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          border: "2px solid rgba(255, 255, 255, 0.1)",
          padding: "60px 80px",
          borderRadius: "24px",
          background: "rgba(255, 255, 255, 0.02)",
        }}
      >
        <div style={{ fontSize: "72px", marginBottom: "20px", display: "flex", filter: "grayscale(100%)" }}>
          ✒️
        </div>
        <div
          style={{
            fontSize: "64px",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.05em",
            marginBottom: "16px",
            display: "flex",
            textTransform: "uppercase",
            borderBottom: "4px solid #9333EA",
            paddingBottom: "8px",
          }}
        >
          Write a Spill
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "rgba(255,255,255,0.5)",
            marginTop: "16px",
            display: "flex",
            letterSpacing: "0.1em",
          }}
        >
          ON THE {board.name.toUpperCase()} BOARD
        </div>
      </div>
      
      <div
        style={{
          position: "absolute",
          bottom: "30",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "rgba(255, 255, 255, 0.3)",
          fontSize: "18px",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        Teaaa Deep Gossip
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}

// ─── Poll OG Image ───
async function renderPollOG(slug: string) {
  const board = await fetchQuery(api.boards.getBySlug, { slug });
  if (!board) return renderDefaultOG();

  // Get active poll for this board
  const poll = await fetchQuery(api.polls.getActivePoll, {
    boardId: board._id,
  });
  if (!poll) {
    // No active poll, fall back to board OG
    return renderBoardOG(slug);
  }

  // Get results
  let optionCounts: number[] = [];
  let totalVotes = poll.totalVotes || 0;
  try {
    const results = await fetchQuery(api.polls.getResults, {
      pollId: poll._id,
    });
    if (results) {
      optionCounts = results.optionCounts;
      totalVotes = results.totalVotes;
    }
  } catch {}

  const maxCount = Math.max(...optionCounts, 1);
  const truncatedQ =
    poll.question.length > 80
      ? `${poll.question.slice(0, 80)}...`
      : poll.question;

  const COLORS = ["#111111", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB"];

  return new ImageResponse(
    <div
      style={{
        width: "1200",
        height: "630",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #faf7f2 0%, #f0ebe3 100%)",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: "-120",
          right: "-120",
          width: "400",
          height: "400",
          borderRadius: "50%",
          background: "rgba(107, 33, 168, 0.06)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-80",
          left: "-80",
          width: "300",
          height: "300",
          borderRadius: "50%",
          background: "rgba(107, 33, 168, 0.04)",
        }}
      />

      {/* Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "900",
          background: "white",
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.05)",
          padding: "48px 56px",
        }}
      >
        {/* Top row: badge + status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "rgba(0,0,0,0.3)",
              background: "rgba(0,0,0,0.04)",
              padding: "8px 20px",
              borderRadius: "100px",
            }}
          >
            🗳️ Poll
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: 700,
              color: poll.isActive ? "#10b981" : "rgba(0,0,0,0.3)",
              background: poll.isActive
                ? "rgba(16,185,129,0.1)"
                : "rgba(0,0,0,0.04)",
              padding: "8px 20px",
              borderRadius: "100px",
            }}
          >
            {poll.isActive ? "🟢 Live" : "🏁 Ended"}
          </div>
        </div>

        {/* Question */}
        <div
          style={{
            fontSize: "36px",
            fontWeight: 900,
            color: "#111",
            lineHeight: 1.3,
            marginBottom: "32px",
            display: "flex",
          }}
        >
          &ldquo;{truncatedQ}&rdquo;
        </div>

        {/* Options with bars */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {poll.options.slice(0, 4).map((option: string, i: number) => {
            const count = optionCounts[i] ?? 0;
            const pct =
              totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const barW =
              totalVotes > 0 ? Math.max(40, (700 * count) / maxCount) : 40;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  position: "relative",
                  height: "48px",
                }}
              >
                {/* Bar background */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(0,0,0,0.02)",
                    borderRadius: "12px",
                    display: "flex",
                  }}
                />
                {/* Bar fill */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: `${barW}px`,
                    height: "100%",
                    background: `${COLORS[i % COLORS.length]}10`,
                    borderRadius: "12px",
                    display: "flex",
                  }}
                />
                {/* Option text */}
                <div
                  style={{
                    position: "relative",
                    flex: 1,
                    paddingLeft: "16px",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#333",
                    display: "flex",
                  }}
                >
                  {option.length > 30 ? `${option.slice(0, 30)}...` : option}
                </div>
                {/* Percentage */}
                <div
                  style={{
                    position: "relative",
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "rgba(0,0,0,0.35)",
                    paddingRight: "16px",
                    display: "flex",
                  }}
                >
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Vote count */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "24px",
          }}
        >
          <div
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "rgba(0,0,0,0.25)",
              display: "flex",
            }}
          >
            {totalVotes} anonymous vote{totalVotes !== 1 ? "s" : ""}
          </div>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "rgba(0,0,0,0.2)",
              display: "flex",
            }}
          >
            Vote at teaadrop.xyz
          </div>
        </div>
      </div>

      {/* Bottom brand */}
      <div
        style={{
          position: "absolute",
          bottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "16px",
          fontWeight: 700,
          color: "rgba(0,0,0,0.15)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        🫖 Teaaa — Anonymous Polls & Confessions
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}

// ─── Fallback OG ───
function renderDefaultOG() {
  return new ImageResponse(
    <div
      style={{
        width: "1200",
        height: "630",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #faf7f2 0%, #f0ebe3 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: "80px", marginBottom: "20px", display: "flex" }}>
        🫖
      </div>
      <div
        style={{
          fontSize: "56px",
          fontWeight: 900,
          color: "#111",
          marginBottom: "12px",
          display: "flex",
        }}
      >
        Teaaa
      </div>
      <div
        style={{
          fontSize: "22px",
          color: "rgba(0,0,0,0.3)",
          display: "flex",
        }}
      >
        Spill it here, don&apos;t carry it alone
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
