import { theme } from "./theme";

export const gmStyles = {
  wrap: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: theme.spacing.lg,
    background: theme.colors.bg,
  },
  card: {
    width: "min(900px, 100%)",
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
  },
  back: { textDecoration: "none", color: "#444" },

  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 10,
  },
  title: { margin: 0, fontSize: 28, color: theme.colors.text },

  helper: { marginTop: 12, marginBottom: 0, opacity: 0.85, color: "#333" },

  section: {
    marginTop: 18,
    paddingTop: 12,
    borderTop: "1px solid rgba(0,0,0,0.08)",
  },
  sectionTitle: {
    margin: "0 0 10px 0",
    fontSize: 18,
    color: theme.colors.text,
  },

  muted: { margin: 0, color: theme.colors.muted },
  error: { marginTop: 12, color: theme.colors.danger },

  codePill: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 14,
    border: `1px solid ${theme.colors.borderStrong}`,
    background: theme.colors.surface2,
  },
  codeLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeValue: {
    fontFamily: theme.font.mono,
    fontSize: 18,
    color: theme.colors.text,
    letterSpacing: 2,
  },

  button: {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${theme.colors.borderStrong}`,
    background: theme.colors.primary,
    color: theme.colors.primaryText,
    fontWeight: 700,
  },

  textarea: {
    marginTop: 12,
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: `1px solid ${theme.colors.borderStrong}`,
    background: "#fff",
    color: theme.colors.text,
    resize: "vertical",
    fontSize: 14,
    lineHeight: 1.4,
  },

  playerGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 12,
  },
  playerCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    border: `1px solid ${theme.colors.border}`,
    background: "#fff",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: theme.colors.primary,
    color: theme.colors.primaryText,
    fontWeight: 700,
  },
  playerName: { fontSize: 16, color: theme.colors.text },
};
