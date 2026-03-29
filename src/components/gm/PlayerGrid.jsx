import { gmStyles as styles } from "../../styles/gmStyles";
import { avatarSrcFromKey } from "../../lib/avatars";

export default function PlayerGrid({ tableLoaded, players, error, onRemove }) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>Players</h2>

      {!tableLoaded && !error && <p style={styles.muted}>Loading table...</p>}

      {tableLoaded && players.length === 0 && (
        <p style={styles.muted}>
          No players yet. Tell them to join with the code.
        </p>
      )}

      <div style={styles.playerGrid}>
        {players.map((p) => (
          <div key={p.id} style={{ ...styles.playerCard, position: "relative" }}>
            <img
              src={avatarSrcFromKey(p.avatar_key)}
              alt=""
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                objectFit: "cover",
                border: "2px solid #6A7984",
                background: "transparent",
              }}
            />

            <div style={styles.playerName}>{p.display_name}</div>

            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(p.id, p.display_name)}
                title={`Remove ${p.display_name}`}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(80,10,10,0.7)",
                  border: "1px solid rgba(139,32,32,0.6)",
                  borderRadius: 2,
                  color: "rgba(245,160,160,0.8)",
                  fontSize: "0.65rem",
                  lineHeight: 1,
                  cursor: "pointer",
                  padding: 0,
                  opacity: 0,
                  transition: "opacity 0.15s",
                }}
                className="player-remove-btn"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .player-remove-btn { opacity: 0 !important; }
        *:hover > .player-remove-btn,
        *:focus-within > .player-remove-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
