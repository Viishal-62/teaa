"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Flag,
  Lightbulb,
  MessageCircle,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  Activity,
  TrendingUp,
  Clock,
  Search,
  X,
  Lock,
  Sparkles,
  BarChart3,
  Layers,
} from "lucide-react";

// ─── Constants ───

const TABS = [
  { id: "boards", label: "Boards", icon: LayoutDashboard },
  { id: "confessions", label: "Confessions", icon: MessageSquare },
  { id: "spills", label: "Spills", icon: BookOpen },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "features", label: "Features", icon: Lightbulb },
  { id: "comments", label: "Comments", icon: MessageCircle },
] as const;

type TabId = (typeof TABS)[number]["id"];

const CATEGORY_COLORS: Record<string, string> = {
  regret: "#f59e0b",
  love: "#ec4899",
  guilt: "#8b5cf6",
  relief: "#10b981",
  longing: "#6366f1",
  mischief: "#f97316",
  obsession: "#e11d48",
  pride: "#14b8a6",
  fear: "#64748b",
  envy: "#22c55e",
  "deep-dark": "#1e1b4b",
  crush: "#fb7185",
  compliment: "#fbbf24",
  attraction: "#f472b6",
  gratitude: "#34d399",
  admiration: "#a78bfa",
  confession: "#818cf8",
  "secret-admirer": "#fb923c",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "under-review": { bg: "rgba(251,191,36,0.15)", text: "#fbbf24" },
  planned: { bg: "rgba(96,165,250,0.15)", text: "#60a5fa" },
  shipped: { bg: "rgba(52,211,153,0.15)", text: "#34d399" },
};

const TIMELINE_COLORS: Record<string, string> = {
  board: "#60a5fa",
  confession: "#34d399",
  spill: "#a78bfa",
  report: "#f87171",
};

// ─── Helpers ───
function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Animated Counter ───
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 800;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span className={className}>{display.toLocaleString()}</span>;
}

// ─── NEW Badge ───
function NewBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        background: "linear-gradient(135deg, #f59e0b, #ef4444)",
        color: "#fff",
        animation: "pulse-badge 2s ease-in-out infinite",
        whiteSpace: "nowrap",
      }}
    >
      <Sparkles size={10} /> NEW
    </span>
  );
}

// ─── Glass Panel ───
function GlassPanel({
  children,
  style,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PASSWORD GATE
// ═══════════════════════════════════════════════════
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        sessionStorage.setItem("teaa-admin-auth", "1");
        onUnlock();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0f",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          x: shake ? [0, -12, 12, -8, 8, -4, 4, 0] : 0,
        }}
        transition={{ duration: 0.5 }}
      >
        <GlassPanel style={{ padding: "48px 40px", maxWidth: 420, width: "100%", textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <Lock size={28} color="#fff" />
          </div>
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>
            Admin Dashboard
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 32px" }}>
            Enter the admin password to continue
          </p>
          <form onSubmit={handleSubmit}>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(false); }}
                placeholder="Password"
                autoFocus
                style={{
                  width: "100%",
                  padding: "14px 44px 14px 16px",
                  borderRadius: 12,
                  border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.35)",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <p style={{ color: "#ef4444", fontSize: 13, margin: "12px 0 0", textAlign: "left" }}>
                Wrong password. Try again.
              </p>
            )}
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                marginTop: 20,
                transition: "opacity 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {loading ? "Verifying..." : "Unlock Dashboard"}
            </button>
          </form>
        </GlassPanel>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// STAT CARDS
// ═══════════════════════════════════════════════════
interface StatCardProps {
  label: string;
  total: number;
  today: number;
  icon: React.ReactNode;
  gradient: string;
  delay: number;
}

function StatCard({ label, total, today, icon, gradient, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <GlassPanel
        style={{
          padding: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: gradient,
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 500, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {label}
            </p>
            <AnimatedNumber value={total} className="" />
            <style>{`
              .stat-number { font-size: 32px; font-weight: 700; color: #fff; }
            `}</style>
            <span style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>
              <AnimatedNumber value={total} />
            </span>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.9,
            }}
          >
            {icon}
          </div>
        </div>
        {today > 0 && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <NewBadge />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
              {today} today
            </span>
          </div>
        )}
      </GlassPanel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════
export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("boards");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Check sessionStorage on mount
  useEffect(() => {
    if (sessionStorage.getItem("teaa-admin-auth") === "1") setAuthed(true);
  }, []);

  if (!authed) return <PasswordGate onUnlock={() => setAuthed(true)} />;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        fontFamily: "'Inter', sans-serif",
        color: "#fff",
      }}
    >
      <style>{`
        @keyframes pulse-badge {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.05); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

        .admin-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .admin-table th {
          text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.35);
          border-bottom: 1px solid rgba(255,255,255,0.06); white-space: nowrap;
        }
        .admin-table td {
          padding: 14px 16px; font-size: 13px; color: rgba(255,255,255,0.7);
          border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle;
        }
        .admin-table tr:hover td { background: rgba(255,255,255,0.02); }
        .admin-table tr:last-child td { border-bottom: none; }

        .admin-tab { padding: 10px 18px; border-radius: 10px; border: none;
          background: transparent; color: rgba(255,255,255,0.4); font-size: 13px;
          font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex;
          align-items: center; gap: 8px; white-space: nowrap; }
        .admin-tab:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.04); }
        .admin-tab.active { color: #fff; background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.1); }

        .delete-btn { padding: 6px 8px; border-radius: 8px; border: 1px solid rgba(239,68,68,0.2);
          background: rgba(239,68,68,0.08); color: #f87171; cursor: pointer;
          transition: all 0.2s; display: flex; align-items: center; gap: 4px; font-size: 12px; }
        .delete-btn:hover { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.4); }

        .status-select { padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05); color: #fff; font-size: 12px; cursor: pointer;
          outline: none; }
        .status-select option { background: #1a1a2e; color: #fff; }

        .search-input { width: 100%; max-width: 320px; padding: 10px 16px 10px 40px;
          border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04); color: #fff; font-size: 13px; outline: none;
          transition: border-color 0.2s; }
        .search-input:focus { border-color: rgba(255,255,255,0.2); }
        .search-input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      {/* ─── Header ─── */}
      <header
        style={{
          padding: "20px 32px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(10,10,15,0.85)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Teaa Admin</h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
              Platform Dashboard
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem("teaa-admin-auth");
            setAuthed(false);
          }}
          style={{
            padding: "8px 16px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: "rgba(255,255,255,0.5)",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </header>

      <div style={{ padding: "32px", maxWidth: 1400, margin: "0 auto" }}>
        {/* ─── Stats ─── */}
        <DashboardStats />

        {/* ─── Activity + Chart Row ─── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginTop: 32,
          }}
        >
          <ActivityTimeline />
          <CategoryChart />
        </div>

        {/* ─── Tabs + Table ─── */}
        <div style={{ marginTop: 32 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 12,
              marginBottom: 20,
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`admin-tab ${activeTab === t.id ? "active" : ""}`}
                onClick={() => { setActiveTab(t.id); setSearchQuery(""); }}
              >
                <t.icon size={15} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 20, display: "inline-block" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.25)",
              }}
            />
            <input
              className="search-input"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.3)",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <GlassPanel style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              {activeTab === "boards" && <BoardsTable search={searchQuery} />}
              {activeTab === "confessions" && (
                <ConfessionsTable
                  search={searchQuery}
                  confirmDelete={confirmDelete}
                  setConfirmDelete={setConfirmDelete}
                />
              )}
              {activeTab === "spills" && <SpillsTable search={searchQuery} />}
              {activeTab === "reports" && <ReportsTable search={searchQuery} />}
              {activeTab === "features" && <FeaturesTable search={searchQuery} />}
              {activeTab === "comments" && <CommentsTable search={searchQuery} />}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════
function DashboardStats() {
  const stats = useQuery(api.admin.adminStats);

  if (!stats) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <GlassPanel key={i} style={{ height: 120, opacity: 0.5 }}>
            <div style={{ padding: 24 }}>
              <div style={{ width: 60, height: 14, background: "rgba(255,255,255,0.05)", borderRadius: 4 }} />
              <div style={{ width: 40, height: 28, background: "rgba(255,255,255,0.05)", borderRadius: 4, marginTop: 12 }} />
            </div>
          </GlassPanel>
        ))}
      </div>
    );
  }

  const cards: StatCardProps[] = [
    { label: "Boards", total: stats.boards.total, today: stats.boards.newToday, icon: <LayoutDashboard size={22} color="#fff" />, gradient: "linear-gradient(135deg, #3b82f6, #6366f1)", delay: 0 },
    { label: "Confessions", total: stats.confessions.total, today: stats.confessions.newToday, icon: <MessageSquare size={22} color="#fff" />, gradient: "linear-gradient(135deg, #f59e0b, #f97316)", delay: 0.05 },
    { label: "Spills", total: stats.spills.total, today: stats.spills.newToday, icon: <BookOpen size={22} color="#fff" />, gradient: "linear-gradient(135deg, #8b5cf6, #a855f7)", delay: 0.1 },
    { label: "Comments", total: stats.comments.total, today: stats.comments.newToday, icon: <MessageCircle size={22} color="#fff" />, gradient: "linear-gradient(135deg, #14b8a6, #10b981)", delay: 0.15 },
    { label: "Reactions", total: stats.reactions.total, today: stats.reactions.newToday, icon: <TrendingUp size={22} color="#fff" />, gradient: "linear-gradient(135deg, #ec4899, #f43f5e)", delay: 0.2 },
    { label: "Reports", total: stats.reports.total, today: stats.reports.newToday, icon: <Flag size={22} color="#fff" />, gradient: "linear-gradient(135deg, #ef4444, #dc2626)", delay: 0.25 },
    { label: "Feature Requests", total: stats.featureRequests.total, today: stats.featureRequests.newToday, icon: <Lightbulb size={22} color="#fff" />, gradient: "linear-gradient(135deg, #fbbf24, #f59e0b)", delay: 0.3 },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ACTIVITY TIMELINE
// ═══════════════════════════════════════════════════
function ActivityTimeline() {
  const timeline = useQuery(api.admin.adminActivityTimeline);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <GlassPanel style={{ padding: "24px", maxHeight: 420, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <Activity size={18} color="#f59e0b" />
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Activity Feed</h3>
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 8 }}>
          {!timeline ? (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading...</p>
          ) : timeline.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No activity yet.</p>
          ) : (
            timeline.slice(0, 25).map((item, i) => (
              <div
                key={`${item.type}-${item.createdAt}-${i}`}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: i < timeline.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: TIMELINE_COLORS[item.type] || "#888",
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: TIMELINE_COLORS[item.type] || "#888" }}>
                      {item.label}
                    </span>
                    {item.isNew && <NewBadge />}
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.5)",
                      margin: "4px 0 0",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.detail}
                  </p>
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {timeAgo(item.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </GlassPanel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
// CATEGORY CHART (simple bar chart)
// ═══════════════════════════════════════════════════
function CategoryChart() {
  const stats = useQuery(api.admin.adminStats);

  const data = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.categoryDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }, [stats]);

  const maxVal = data.length > 0 ? Math.max(...data.map(([, v]) => v)) : 1;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
      <GlassPanel style={{ padding: "24px", height: 420, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <BarChart3 size={18} color="#a78bfa" />
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Top Categories</h3>
        </div>
        {!stats ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading...</p>
        ) : data.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No data yet.</p>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
            {data.map(([cat, count]) => (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 90,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                    textAlign: "right",
                    textTransform: "capitalize",
                    flexShrink: 0,
                  }}
                >
                  {cat.replace("-", " ")}
                </span>
                <div style={{ flex: 1, height: 24, background: "rgba(255,255,255,0.04)", borderRadius: 6, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxVal) * 100}%` }}
                    transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                    style={{
                      height: "100%",
                      background: CATEGORY_COLORS[cat] || "#6366f1",
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      paddingRight: 8,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{count}</span>
                  </motion.div>
                </div>
              </div>
            ))}

            {/* Type breakdown mini */}
            {stats.typeDistribution && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                {Object.entries(stats.typeDistribution).map(([t, count]) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>
                      {t === "voice" ? "🎤" : t === "canvas" ? "🎨" : "💬"}
                    </span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "capitalize" }}>
                      {t}: <span style={{ color: "#fff", fontWeight: 600 }}>{count}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </GlassPanel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
// DATA TABLES
// ═══════════════════════════════════════════════════

// ─── Boards ───
function BoardsTable({ search }: { search: string }) {
  const boards = useQuery(api.admin.adminListBoards);
  const deleteBoard = useMutation(api.admin.adminDeleteBoard);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (!boards) return <TableLoading />;

  const q = search.toLowerCase();
  const filtered = boards.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      b.boardType.toLowerCase().includes(q),
  );

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th></th>
          <th>Name</th>
          <th>Slug</th>
          <th>Type</th>
          <th>Visibility</th>
          <th>Confessions</th>
          <th>Spills</th>
          <th>Views</th>
          <th>Created</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <EmptyRow colSpan={10} />
        ) : (
          filtered.map((b) => (
            <tr key={b._id}>
              <td>{b.isNew && <NewBadge />}</td>
              <td style={{ fontWeight: 500, color: "#fff" }}>{b.name}</td>
              <td>
                <a
                  href={`/b/${b.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#60a5fa", textDecoration: "none" }}
                >
                  /{b.slug}
                </a>
              </td>
              <td>
                <TypeBadge type={b.boardType} />
              </td>
              <td>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    background: b.visibility === "private" ? "rgba(239,68,68,0.12)" : "rgba(52,211,153,0.12)",
                    color: b.visibility === "private" ? "#f87171" : "#34d399",
                  }}
                >
                  {b.visibility}
                </span>
              </td>
              <td>{b.confessionCount}</td>
              <td>{b.spillCount}</td>
              <td>{b.totalViews.toLocaleString()}</td>
              <td style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{timeAgo(b.createdAt)}</td>
              <td>
                {confirmId === b._id ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      className="delete-btn"
                      onClick={async () => {
                        await deleteBoard({ boardId: b._id as Id<"boards"> });
                        setConfirmId(null);
                      }}
                      style={{ background: "rgba(239,68,68,0.3)", color: "#fff" }}
                    >
                      Confirm
                    </button>
                    <button className="delete-btn" onClick={() => setConfirmId(null)} style={{ color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.1)" }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button className="delete-btn" onClick={() => setConfirmId(b._id)}>
                    <Trash2 size={12} />
                  </button>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ─── Confessions ───
function ConfessionsTable({
  search,
  confirmDelete,
  setConfirmDelete,
}: {
  search: string;
  confirmDelete: string | null;
  setConfirmDelete: (id: string | null) => void;
}) {
  const confessions = useQuery(api.admin.adminListConfessions);
  const deleteConfession = useMutation(api.admin.adminDeleteConfession);

  if (!confessions) return <TableLoading />;

  const q = search.toLowerCase();
  const filtered = confessions.filter(
    (c) =>
      c.text.toLowerCase().includes(q) ||
      c.boardName.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.displayName.toLowerCase().includes(q),
  );

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th></th>
          <th>Confession</th>
          <th>Board</th>
          <th>Category</th>
          <th>Type</th>
          <th><Eye size={13} /></th>
          <th>Reactions</th>
          <th>Comments</th>
          <th>Flagged</th>
          <th>Created</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <EmptyRow colSpan={11} />
        ) : (
          filtered.map((c) => (
            <tr key={c._id} style={c.isFlagged ? { background: "rgba(239,68,68,0.04)" } : {}}>
              <td>{c.isNew && <NewBadge />}</td>
              <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.text}
              </td>
              <td style={{ whiteSpace: "nowrap" }}>{c.boardName}</td>
              <td>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    background: `${CATEGORY_COLORS[c.category] || "#6366f1"}22`,
                    color: CATEGORY_COLORS[c.category] || "#6366f1",
                    fontWeight: 500,
                    textTransform: "capitalize",
                  }}
                >
                  {c.category.replace("-", " ")}
                </span>
              </td>
              <td>
                <span style={{ fontSize: 14 }}>
                  {c.type === "voice" ? "🎤" : c.type === "canvas" ? "🎨" : "💬"}
                </span>
              </td>
              <td>{c.views.toLocaleString()}</td>
              <td>{c.reactionCount}</td>
              <td>{c.commentCount}</td>
              <td>
                {c.isFlagged ? (
                  <span style={{ color: "#f87171", fontSize: 12, fontWeight: 600 }}>⚠️ {c.flagReason || "Yes"}</span>
                ) : (
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>—</span>
                )}
              </td>
              <td style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{timeAgo(c.createdAt)}</td>
              <td>
                {confirmDelete === c._id ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      className="delete-btn"
                      onClick={async () => {
                        await deleteConfession({ confessionId: c._id as Id<"confessions"> });
                        setConfirmDelete(null);
                      }}
                      style={{ background: "rgba(239,68,68,0.3)", color: "#fff" }}
                    >
                      Confirm
                    </button>
                    <button className="delete-btn" onClick={() => setConfirmDelete(null)} style={{ color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.1)" }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button className="delete-btn" onClick={() => setConfirmDelete(c._id)}>
                    <Trash2 size={12} />
                  </button>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ─── Spills ───
function SpillsTable({ search }: { search: string }) {
  const spills = useQuery(api.admin.adminListSpills);

  if (!spills) return <TableLoading />;

  const q = search.toLowerCase();
  const filtered = spills.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.boardName.toLowerCase().includes(q) ||
      s.displayName.toLowerCase().includes(q),
  );

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th></th>
          <th>Title</th>
          <th>Board</th>
          <th>Author</th>
          <th>Chapters</th>
          <th><Eye size={13} /></th>
          <th>Reactions</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <EmptyRow colSpan={8} />
        ) : (
          filtered.map((s) => (
            <tr key={s._id}>
              <td>{s.isNew && <NewBadge />}</td>
              <td style={{ fontWeight: 500, color: "#fff" }}>
                {s.coverEmoji} {s.title}
              </td>
              <td>{s.boardName}</td>
              <td style={{ color: "rgba(255,255,255,0.4)" }}>{s.displayName}</td>
              <td>{s.chapterCount}</td>
              <td>{s.views.toLocaleString()}</td>
              <td>{s.reactionCount}</td>
              <td style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{timeAgo(s.createdAt)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ─── Reports ───
function ReportsTable({ search }: { search: string }) {
  const reports = useQuery(api.admin.adminListReports);
  const deleteConfession = useMutation(api.admin.adminDeleteConfession);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (!reports) return <TableLoading />;

  const q = search.toLowerCase();
  const filtered = reports.filter(
    (r) =>
      r.reason.toLowerCase().includes(q) ||
      r.confessionText.toLowerCase().includes(q) ||
      r.boardName.toLowerCase().includes(q),
  );

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th></th>
          <th>Confession</th>
          <th>Board</th>
          <th>Reason</th>
          <th>Reported</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <EmptyRow colSpan={6} />
        ) : (
          filtered.map((r) => (
            <tr key={r._id} style={{ background: "rgba(239,68,68,0.03)" }}>
              <td>{r.isNew && <NewBadge />}</td>
              <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.confessionText}
              </td>
              <td>{r.boardName}</td>
              <td style={{ color: "#f87171", fontWeight: 500 }}>{r.reason}</td>
              <td style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{timeAgo(r.createdAt)}</td>
              <td>
                {confirmId === r._id ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      className="delete-btn"
                      onClick={async () => {
                        await deleteConfession({ confessionId: r.confessionId as Id<"confessions"> });
                        setConfirmId(null);
                      }}
                      style={{ background: "rgba(239,68,68,0.3)", color: "#fff" }}
                    >
                      Delete Confession
                    </button>
                    <button className="delete-btn" onClick={() => setConfirmId(null)} style={{ color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.1)" }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button className="delete-btn" onClick={() => setConfirmId(r._id)}>
                    <Trash2 size={12} /> Remove
                  </button>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ─── Features ───
function FeaturesTable({ search }: { search: string }) {
  const features = useQuery(api.admin.adminListFeatureRequests);
  const updateStatus = useMutation(api.admin.adminUpdateFeatureStatus);

  if (!features) return <TableLoading />;

  const q = search.toLowerCase();
  const filtered = features.filter(
    (f) =>
      f.title.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.status.toLowerCase().includes(q),
  );

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th></th>
          <th>Title</th>
          <th>Description</th>
          <th>Status</th>
          <th>Upvotes</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <EmptyRow colSpan={6} />
        ) : (
          filtered.map((f) => (
            <tr key={f._id}>
              <td>{f.isNew && <NewBadge />}</td>
              <td style={{ fontWeight: 500, color: "#fff", maxWidth: 200 }}>{f.title}</td>
              <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(255,255,255,0.5)" }}>
                {f.description}
              </td>
              <td>
                <select
                  className="status-select"
                  value={f.status}
                  onChange={async (e) => {
                    await updateStatus({
                      requestId: f._id as Id<"featureRequests">,
                      status: e.target.value,
                    });
                  }}
                  style={{
                    background: STATUS_COLORS[f.status]?.bg || "rgba(255,255,255,0.05)",
                    color: STATUS_COLORS[f.status]?.text || "#fff",
                    borderColor: STATUS_COLORS[f.status]?.text || "rgba(255,255,255,0.1)",
                  }}
                >
                  <option value="under-review">Under Review</option>
                  <option value="planned">Planned</option>
                  <option value="shipped">Shipped</option>
                </select>
              </td>
              <td>
                <span style={{ fontWeight: 600 }}>▲ {f.upvotes}</span>
              </td>
              <td style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{timeAgo(f.createdAt)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ─── Comments ───
function CommentsTable({ search }: { search: string }) {
  const comments = useQuery(api.admin.adminListComments);

  if (!comments) return <TableLoading />;

  const q = search.toLowerCase();
  const filtered = comments.filter(
    (c) =>
      c.text.toLowerCase().includes(q) ||
      c.boardName.toLowerCase().includes(q) ||
      c.displayName.toLowerCase().includes(q),
  );

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th></th>
          <th>Comment</th>
          <th>Author</th>
          <th>On Confession</th>
          <th>Board</th>
          <th>GIF</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <EmptyRow colSpan={7} />
        ) : (
          filtered.map((c) => (
            <tr key={c._id}>
              <td>{c.isNew && <NewBadge />}</td>
              <td style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.text}
              </td>
              <td style={{ color: "rgba(255,255,255,0.4)" }}>{c.displayName}</td>
              <td style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(255,255,255,0.4)" }}>
                {c.confessionPreview}
              </td>
              <td>{c.boardName}</td>
              <td>{c.gifUrl ? "🖼️" : "—"}</td>
              <td style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{timeAgo(c.createdAt)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ─── Shared Components ───
function TableLoading() {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div
        style={{
          width: 32,
          height: 32,
          border: "3px solid rgba(255,255,255,0.1)",
          borderTopColor: "#f59e0b",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 12px",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading data...</p>
    </div>
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.25)" }}>
        No results found
      </td>
    </tr>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    default: { bg: "rgba(96,165,250,0.12)", text: "#60a5fa" },
    "secret-admirer": { bg: "rgba(251,146,60,0.12)", text: "#fb923c" },
  };
  const c = colors[type] || colors.default;
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.text,
        textTransform: "capitalize",
      }}
    >
      {type.replace("-", " ")}
    </span>
  );
}
