"use client";

import { forwardRef } from "react";
import { CATEGORY_INFO } from "@/app/lib/utils";
import { Eye } from "lucide-react";

interface CardDownloadRendererProps {
  confession: {
    type?: string;
    text?: string;
    canvasImageUrl?: string;
    caption?: string;
    category: string;
    displayName: string;
    views?: number;
    cityId?: string;
    professionId?: string;
    contextId?: string;
  };
  totalReactions?: number;
  reactionCounts?: Record<string, number>;
}

const CardDownloadRenderer = forwardRef<
  HTMLDivElement,
  CardDownloadRendererProps
>(function CardDownloadRenderer(
  { confession, totalReactions, reactionCounts },
  ref,
) {
  const catInfo = CATEGORY_INFO[confession.category];

  return (
    <div
      style={{
        position: "fixed",
        left: "-9999px",
        top: "0px",
        width: "400px",
        overflow: "hidden",
        zIndex: -1,
        pointerEvents: "none",
        opacity: 0,
      }}
    >
      <div
        ref={ref}
        style={{
          width: "400px",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            width: "400px",
            background: "#faf7f2",
            borderRadius: "20px",
            overflow: "hidden",
            padding: "0",
            boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
          }}
        >
          {/* Inner frame with dashed border */}
          <div
            style={{
              margin: "6px",
              border: "1px dashed rgba(0,0,0,0.1)",
              borderRadius: "14px",
              padding: "32px 28px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minHeight: "480px",
            }}
          >
            {/* Top: icon + category */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <span style={{ fontSize: "28px", marginBottom: "6px" }}>🫖</span>
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: catInfo?.color ?? "#666",
                }}
              >
                {catInfo?.label ?? confession.category}
              </span>
              {/* Context Chips */}
              {(confession.cityId || confession.professionId || confession.contextId) && (
                <div style={{ display: "flex", gap: "6px", marginTop: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                  {confession.cityId && (
                    <span style={{ fontSize: "9px", padding: "4px 8px", borderRadius: "12px", background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>📍 {confession.cityId}</span>
                  )}
                  {confession.professionId && (
                    <span style={{ fontSize: "9px", padding: "4px 8px", borderRadius: "12px", background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>💼 {confession.professionId}</span>
                  )}
                  {confession.contextId && (
                    <span style={{ fontSize: "9px", padding: "4px 8px", borderRadius: "12px", background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>🫂 {confession.contextId}</span>
                  )}
                </div>
              )}
            </div>

            {/* Confession content */}
            {confession.canvasImageUrl ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  padding: "0 20px",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={confession.canvasImageUrl}
                  crossOrigin="anonymous"
                  alt="Doodle Confession"
                  style={{
                    width: "100%",
                    borderRadius: "12px",
                    border: "1px solid rgba(0,0,0,0.06)",
                    backgroundColor: "#f5f0e8",
                  }}
                />
                {(confession.caption || confession.text) && (
                  <p
                    style={{
                      marginTop: "12px",
                      textAlign: "center",
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontSize: "14px",
                      fontStyle: "italic",
                      color: "rgba(0,0,0,0.6)",
                      margin: 0,
                    }}
                  >
                    &ldquo;{confession.caption || confession.text}&rdquo;
                  </p>
                )}
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 12px",
                }}
              >
                <p
                  style={{
                    textAlign: "center",
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "17px",
                    lineHeight: 1.7,
                    color: "#2a2a2a",
                    margin: 0,
                  }}
                >
                  {confession.text}
                </p>
              </div>
            )}

            {/* Stats */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                marginTop: "24px",
                marginBottom: "12px",
                fontSize: "10px",
                color: "rgba(0,0,0,0.3)",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <Eye size={11} style={{ opacity: 0.7 }} />{" "}
                {confession.views || 0}
              </span>
              {totalReactions !== undefined && totalReactions > 0 && (
                <>
                  <span
                    style={{
                      width: "3px",
                      height: "3px",
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.2)",
                    }}
                  />
                  <span>Felt by {totalReactions}</span>
                </>
              )}
            </div>

            {/* Display name */}
            <p
              style={{
                fontSize: "11px",
                color: "rgba(0,0,0,0.25)",
                fontStyle: "italic",
                margin: "0 0 20px 0",
              }}
            >
              — {confession.displayName}
            </p>

            {/* Watermark */}
            <div
              style={{
                borderTop: "1px solid rgba(0,0,0,0.06)",
                paddingTop: "14px",
                width: "100%",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "rgba(0,0,0,0.15)",
                }}
              >
                🫖 Teaaa — spill it anonymously
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CardDownloadRenderer;
