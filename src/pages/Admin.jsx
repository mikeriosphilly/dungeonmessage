import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { supabase } from "../lib/supabaseClient";

const CORRECT_PASSWORD = "karenia";
const PAGE_SIZE = 10;

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#1c1a17",
  surface: "#252220",
  surface2: "#1c1915",
  surface3: "#2d2a25",
  text: "#D5CDBE",
  muted: "#B8AD96",
  faint: "#8a7f6e",
  border: "rgba(245, 236, 205, 0.13)",
  borderStrong: "rgba(245, 236, 205, 0.26)",
  gold: "#978262",
  goldBright: "#c4a96e",
  parchment: "#F5ECCD",
  danger: "#b03030",
  chartBar: "#7a6a4e",
  chartBarHover: "#c4a96e",
  chartLine1: "#c4a96e",
  chartLine2: "#5e8a72",
};

// ── Recharts custom tooltip ───────────────────────────────────────────────────
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={styles.tooltip}>
      <div style={styles.tooltipLabel}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ ...styles.tooltipRow, color: p.color }}>
          <span>{p.name}:</span>
          <span style={{ marginLeft: 8, fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Password Gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onUnlock }) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (value.trim() === CORRECT_PASSWORD) {
      onUnlock();
    } else {
      setShake(true);
      setError(true);
      setValue("");
      setTimeout(() => setShake(false), 600);
    }
  }

  return (
    <div style={styles.gatePage}>
      <div style={styles.gateWrap}>
        {/* Ornamental gem divider */}
        <div style={styles.gateDivider}>
          <span style={styles.gateDividerLine} />
          <span style={styles.gateDividerGem}>◆</span>
          <span style={styles.gateDividerLine} />
        </div>

        <h1 style={styles.gateTitle}>The Scribe's Vault</h1>
        <p style={styles.gateSubtitle}>Restricted chronicle. Speak the word.</p>

        <form onSubmit={handleSubmit} style={styles.gateForm}>
          <div
            style={{
              ...styles.gateInputWrap,
              ...(shake ? styles.shake : {}),
              borderColor: error ? C.danger : C.borderStrong,
            }}
          >
            <input
              type="password"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
              placeholder="Passphrase"
              autoFocus
              style={styles.gateInput}
            />
          </div>
          {error && (
            <p style={styles.gateError}>The vault does not open for you.</p>
          )}
          <button type="submit" style={styles.gateBtn}>
            <span style={styles.gateBtnLabel}>Enter</span>
          </button>
        </form>

        <div style={{ ...styles.gateDivider, marginTop: 32, opacity: 0.4 }}>
          <span style={styles.gateDividerLine} />
          <span style={styles.gateDividerGem}>◆</span>
          <span style={styles.gateDividerLine} />
        </div>
      </div>

      <style>{`
        @keyframes gateShake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
        .shake-anim { animation: gateShake 0.5s ease; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .admin-fade-in { animation: fadeUp 0.5s ease both; }
      `}</style>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, loading }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>
        {loading ? <span style={styles.statLoading}>—</span> : value}
      </div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

// ── Sessions Table ─────────────────────────────────────────────────────────────
function SessionsTable({ rows, loading }) {
  const [shown, setShown] = useState(PAGE_SIZE);

  const visible = rows.slice(0, shown);
  const hasMore = rows.length > shown;

  function fmt(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div style={styles.tableWrap}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>Recent Sessions</span>
        <span style={styles.sectionMeta}>{rows.length} total archived</span>
      </div>

      {loading ? (
        <div style={styles.loadingRow}>Loading…</div>
      ) : (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Table Name", "Created", "Players", "Messages"].map((h) => (
                  <th key={h} style={styles.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row, i) => (
                <tr
                  key={row.id}
                  style={{
                    ...styles.tr,
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                  }}
                >
                  <td style={{ ...styles.td, ...styles.tdName }}>
                    {row.table_name || <span style={{ opacity: 0.4 }}>Unnamed</span>}
                  </td>
                  <td style={{ ...styles.td, ...styles.tdMono }}>
                    {fmt(row.table_created_at)}
                  </td>
                  <td style={{ ...styles.td, ...styles.tdNum }}>
                    {row.player_count}
                  </td>
                  <td style={{ ...styles.td, ...styles.tdNum }}>
                    {row.messages_sent_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {hasMore && (
            <button
              onClick={() => setShown((s) => s + PAGE_SIZE)}
              style={styles.showMoreBtn}
            >
              Show next {Math.min(PAGE_SIZE, rows.length - shown)}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("table_archive")
        .select("*")
        .order("table_created_at", { ascending: true });
      if (!error) setRows(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    return {
      totalTables: rows.length,
      totalPlayers: rows.reduce((s, r) => s + (r.player_count || 0), 0),
      totalMessages: rows.reduce((s, r) => s + (r.messages_sent_count || 0), 0),
    };
  }, [rows]);

  // ── Bar chart: tables per day ────────────────────────────────────────────
  const barData = useMemo(() => {
    const byDay = {};
    rows.forEach((r) => {
      const d = r.table_created_at?.slice(0, 10);
      if (!d) return;
      byDay[d] = (byDay[d] || 0) + 1;
    });
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: fmtShort(date),
        rawDate: date,
        Tables: count,
      }));
  }, [rows]);

  // ── Line chart: cumulative tables + players ──────────────────────────────
  const lineData = useMemo(() => {
    let cumTables = 0;
    let cumPlayers = 0;
    const byDay = {};
    rows.forEach((r) => {
      const d = r.table_created_at?.slice(0, 10);
      if (!d) return;
      if (!byDay[d]) byDay[d] = { tables: 0, players: 0 };
      byDay[d].tables += 1;
      byDay[d].players += r.player_count || 0;
    });
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => {
        cumTables += v.tables;
        cumPlayers += v.players;
        return {
          date: fmtShort(date),
          "Cumulative Tables": cumTables,
          "Cumulative Players": cumPlayers,
        };
      });
  }, [rows]);

  // ── Recent sessions (sorted newest first) ───────────────────────────────
  const recentRows = useMemo(
    () => [...rows].sort((a, b) => new Date(b.table_created_at) - new Date(a.table_created_at)),
    [rows],
  );

  return (
    <div style={styles.dashboard}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerDivider}>
          <span style={styles.headerDivLine} />
          <span style={styles.headerGem}>◆</span>
          <span style={styles.headerDivLine} />
        </div>
        <h1 style={styles.dashTitle}>Scribe's Chronicle</h1>
        <p style={styles.dashSubtitle}>DungeonMessage — Usage Archive</p>
        <div style={{ ...styles.headerDivider, opacity: 0.35, marginTop: 12 }}>
          <span style={styles.headerDivLine} />
          <span style={styles.headerGem}>◆</span>
          <span style={styles.headerDivLine} />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={styles.statsRow}>
        <StatCard label="Tables Created" value={stats.totalTables} loading={loading} />
        <StatCard label="Total Players" value={stats.totalPlayers} loading={loading} />
        <StatCard label="Messages Sent" value={stats.totalMessages} loading={loading} />
      </div>

      {/* ── Charts ── */}
      <div style={styles.chartsGrid}>
        {/* Bar chart */}
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>Tables Created per Day</div>
          {!loading && barData.length === 0 ? (
            <div style={styles.noData}>No data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.border} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: C.faint, fontSize: 11, fontFamily: "Lato, sans-serif" }}
                  axisLine={{ stroke: C.border }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: C.faint, fontSize: 11, fontFamily: "Lato, sans-serif" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="Tables" fill={C.chartBar} radius={[3, 3, 0, 0]} activeBar={{ fill: C.chartBarHover }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line chart */}
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>Cumulative Growth</div>
          {!loading && lineData.length === 0 ? (
            <div style={styles.noData}>No data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.border} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: C.faint, fontSize: 11, fontFamily: "Lato, sans-serif" }}
                  axisLine={{ stroke: C.border }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: C.faint, fontSize: 11, fontFamily: "Lato, sans-serif" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<DarkTooltip />} />
                <Legend
                  wrapperStyle={{
                    fontSize: 11,
                    fontFamily: "Lato, sans-serif",
                    color: C.muted,
                    paddingTop: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Cumulative Tables"
                  stroke={C.chartLine1}
                  strokeWidth={2}
                  dot={{ fill: C.chartLine1, r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Cumulative Players"
                  stroke={C.chartLine2}
                  strokeWidth={2}
                  dot={{ fill: C.chartLine2, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Sessions table ── */}
      <SessionsTable rows={recentRows} loading={loading} />
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
export default function Admin() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  return <Dashboard />;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtShort(isoDate) {
  if (!isoDate) return "";
  const [, m, d] = isoDate.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  // Password gate
  gatePage: {
    minHeight: "100vh",
    background: C.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
  },
  gateWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "min(400px, 100%)",
  },
  gateDivider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    marginBottom: 24,
  },
  gateDividerLine: {
    flex: 1,
    height: 1,
    background: `linear-gradient(to right, transparent, ${C.gold}60, transparent)`,
  },
  gateDividerGem: {
    color: C.gold,
    fontSize: "0.65rem",
    opacity: 0.8,
  },
  gateTitle: {
    fontFamily: "var(--tw-font-heading, 'Cinzel Decorative', serif)",
    fontSize: "1.9rem",
    letterSpacing: "0.04em",
    color: C.parchment,
    margin: "0 0 6px",
    textAlign: "center",
  },
  gateSubtitle: {
    fontFamily: "Lato, sans-serif",
    fontStyle: "italic",
    fontSize: "0.875rem",
    color: C.muted,
    margin: "0 0 32px",
    textAlign: "center",
  },
  gateForm: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  gateInputWrap: {
    width: "100%",
    border: `1px solid ${C.borderStrong}`,
    background: C.surface,
    transition: "border-color 0.2s",
  },
  gateInput: {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    padding: "14px 18px",
    fontFamily: "Lato, sans-serif",
    fontSize: "0.95rem",
    color: C.text,
    letterSpacing: "0.08em",
    boxSizing: "border-box",
  },
  gateError: {
    fontFamily: "Lato, sans-serif",
    fontStyle: "italic",
    fontSize: "0.8rem",
    color: C.danger,
    margin: 0,
  },
  gateBtn: {
    marginTop: 4,
    padding: "13px 48px",
    background: "#434135",
    border: `1px solid ${C.gold}`,
    boxShadow: `inset 0 0 18px 2px rgba(155,127,63,0.6), 0 8px 24px rgba(0,0,0,0.5)`,
    color: C.parchment,
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  gateBtnLabel: {
    fontFamily: "var(--tw-font-heading, 'Cinzel Decorative', serif)",
    fontSize: "1rem",
    letterSpacing: "0.08em",
  },
  shake: {
    animation: "gateShake 0.5s ease",
  },

  // Dashboard
  dashboard: {
    minHeight: "100vh",
    background: C.bg,
    padding: "48px 32px 80px",
    maxWidth: 1100,
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: 40,
  },
  headerDivider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "min(480px, 100%)",
    margin: "0 auto 16px",
  },
  headerDivLine: {
    flex: 1,
    height: 1,
    background: `linear-gradient(to right, transparent, ${C.gold}55, transparent)`,
  },
  headerGem: {
    color: C.gold,
    fontSize: "0.65rem",
  },
  dashTitle: {
    fontFamily: "var(--tw-font-heading, 'Cinzel Decorative', serif)",
    fontSize: "clamp(1.5rem, 4vw, 2.4rem)",
    letterSpacing: "0.04em",
    color: C.parchment,
    margin: "0 0 6px",
  },
  dashSubtitle: {
    fontFamily: "Lato, sans-serif",
    fontStyle: "italic",
    fontSize: "0.875rem",
    color: C.faint,
    margin: 0,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },

  // Stat cards
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    padding: "28px 24px 22px",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
  },
  statValue: {
    fontFamily: "var(--tw-font-heading, 'Cinzel Decorative', serif)",
    fontSize: "clamp(2rem, 5vw, 3rem)",
    color: C.goldBright,
    lineHeight: 1,
    marginBottom: 10,
    textShadow: `0 0 24px rgba(196,169,110,0.25)`,
  },
  statLoading: {
    opacity: 0.3,
  },
  statLabel: {
    fontFamily: "Lato, sans-serif",
    fontWeight: 700,
    fontSize: "0.72rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: C.faint,
  },

  // Charts
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 16,
    marginBottom: 32,
  },
  chartCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    padding: "20px 16px 12px",
  },
  chartTitle: {
    fontFamily: "Lato, sans-serif",
    fontWeight: 700,
    fontSize: "0.72rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: C.gold,
    marginBottom: 16,
  },
  noData: {
    fontFamily: "Lato, sans-serif",
    fontStyle: "italic",
    color: C.faint,
    fontSize: "0.875rem",
    padding: "40px 0",
    textAlign: "center",
  },

  // Tooltip
  tooltip: {
    background: C.surface3,
    border: `1px solid ${C.borderStrong}`,
    padding: "10px 14px",
    fontFamily: "Lato, sans-serif",
    fontSize: "0.82rem",
  },
  tooltipLabel: {
    color: C.parchment,
    fontWeight: 700,
    marginBottom: 4,
    letterSpacing: "0.04em",
  },
  tooltipRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    color: C.muted,
  },

  // Sessions table
  tableWrap: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    overflow: "hidden",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px 14px",
    borderBottom: `1px solid ${C.border}`,
  },
  sectionTitle: {
    fontFamily: "Lato, sans-serif",
    fontWeight: 700,
    fontSize: "0.72rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: C.gold,
  },
  sectionMeta: {
    fontFamily: "Lato, sans-serif",
    fontSize: "0.78rem",
    color: C.faint,
  },
  loadingRow: {
    padding: "40px 20px",
    textAlign: "center",
    fontFamily: "Lato, sans-serif",
    fontStyle: "italic",
    color: C.faint,
    fontSize: "0.875rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    fontFamily: "Lato, sans-serif",
    fontWeight: 700,
    fontSize: "0.7rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: C.faint,
    padding: "10px 20px",
    textAlign: "left",
    borderBottom: `1px solid ${C.border}`,
  },
  tr: {
    transition: "background 0.1s",
  },
  td: {
    padding: "11px 20px",
    fontFamily: "Lato, sans-serif",
    fontSize: "0.875rem",
    color: C.text,
    borderBottom: `1px solid ${C.border}`,
  },
  tdName: {
    color: C.muted,
    maxWidth: 280,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  tdMono: {
    fontFamily: "ui-monospace, Menlo, monospace",
    fontSize: "0.8rem",
    color: C.faint,
  },
  tdNum: {
    textAlign: "center",
    color: C.goldBright,
    fontWeight: 700,
    fontFamily: "ui-monospace, Menlo, monospace",
    fontSize: "0.9rem",
  },
  showMoreBtn: {
    display: "block",
    width: "100%",
    padding: "14px",
    background: "transparent",
    border: "none",
    borderTop: `1px solid ${C.border}`,
    fontFamily: "Lato, sans-serif",
    fontWeight: 700,
    fontSize: "0.75rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: C.gold,
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
  },
};
