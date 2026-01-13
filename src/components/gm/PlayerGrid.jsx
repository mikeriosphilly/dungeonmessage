import { gmStyles as styles } from "../../styles/gmStyles";

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
            <div style={styles.avatar} aria-hidden="true">
              {p.display_name?.trim()?.[0]?.toUpperCase() || "?"}
            </div>
            <div style={styles.playerName}>{p.display_name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
