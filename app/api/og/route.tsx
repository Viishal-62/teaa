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
    if (type === "confession" && id) {
      return await renderConfessionOG(id);
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
