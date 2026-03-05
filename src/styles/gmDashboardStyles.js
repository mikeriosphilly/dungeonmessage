// src/styles/gmDashboardStyles.js

export const gmDashboardStyles = {
  sectionHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  editingBadge: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(245, 236, 205, 0.28)",
    background: "#1c1915",
    color: "#D5CDBE",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    userSelect: "none",
  },

  checkboxLabel: {
    color: "#D5CDBE",
    fontWeight: 600,
  },

  pickLabel: {
    fontSize: 12,
    color: "#B8AD96",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },

  pillWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },

  pill: {
    border: "1px solid rgba(245, 236, 205, 0.28)",
    background: "#252220",
    color: "#D5CDBE",
    padding: "8px 10px",
    borderRadius: 999,
    cursor: "pointer",
    fontWeight: 600,
  },

  pillSelected: {
    background: "#F5ECCD",
    color: "#111009",
    border: "1px solid rgba(245, 236, 205, 0.28)",
  },

  actionRow: {
    display: "flex",
    gap: 10,
    marginTop: 12,
  },

  linkButton: {
    marginTop: 10,
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    color: "#B8AD96",
    textDecoration: "underline",
    fontWeight: 600,
  },

  draftCard: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    alignItems: "stretch",
    border: "1px solid rgba(245, 236, 205, 0.15)",
    background: "#c4a878",
    borderRadius: 14,
    padding: 12,
  },

  draftMainButton: {
    textAlign: "left",
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    display: "grid",
    gap: 6,
  },

  draftMeta: {
    fontSize: 12,
    color: "#6A5E48",
  },

  draftBody: {
    color: "#2e1f0a",
    whiteSpace: "pre-wrap",
    lineHeight: 1.35,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
  },

  draftDelete: {
    border: "1px solid rgba(245, 236, 205, 0.28)",
    background: "#1c1915",
    color: "#D5CDBE",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 700,
    height: "100%",
    whiteSpace: "nowrap",
  },
};
