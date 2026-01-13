import { gmStyles as styles } from "../../styles/gmStyles";

export default function MessageComposer({
  players,
  draft,
  setDraft,
  sending,
  sendDisabled,
  sendMessage,
  sendToEveryone,
  setSendToEveryone,
  selectedIds,
  toggleRecipient,
}) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>Send message</h2>

      <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          type="checkbox"
          checked={sendToEveryone}
          onChange={(e) => setSendToEveryone(e.target.checked)}
        />
        Send to everyone
      </label>

      {!sendToEveryone && (
        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {players.map((p) => {
            const checked = selectedIds.includes(p.id);
            return (
              <label
                key={p.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.12)",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleRecipient(p.id)}
                />
                {p.display_name}
              </label>
            );
          })}
        </div>
      )}

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Write a secret note..."
        style={styles.textarea}
        rows={4}
      />

      <button
        onClick={sendMessage}
        disabled={sendDisabled}
        style={{
          ...styles.button,
          marginTop: 12,
          width: "100%",
          opacity: sendDisabled ? 0.6 : 1,
          cursor: sendDisabled ? "not-allowed" : "pointer",
        }}
      >
        {sending ? "Sending..." : "Send"}
      </button>
    </div>
  );
}
