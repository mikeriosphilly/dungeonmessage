import { gmStyles as styles } from "../../styles/gmStyles";
import { avatarSrcFromKey } from "../../lib/avatars";

export default function PlayerGrid({ tableLoaded, players, error }) {
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
          <div key={p.id} style={styles.playerCard}>
            <img
              src={avatarSrcFromKey(p.avatar_key)}
              alt=""
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                objectFit: "cover",
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#fff",
              }}
            />

            <div style={styles.playerName}>{p.display_name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
