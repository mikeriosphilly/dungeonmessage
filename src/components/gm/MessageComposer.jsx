import { gmStyles as styles } from "../../styles/gmStyles";

export default function MessageComposer({
  players,
  draft,
  setDraft,
  sending,
  sendDisabled,
  sendMessage,

  // recipients UI
  sendToEveryone,
  setSendToEveryone,
  selectedIds,
  toggleRecipient,

  // image UI
  imageUrl, // string preview URL (either blob: or https://)
  onPickImage, // (event) => void
  onRemoveImage, // () => void
  imageUploading, // boolean
}) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>Send message</h2>

      <label style={localStyles.checkboxRow}>
        <input
          type="checkbox"
          checked={sendToEveryone}
          onChange={(e) => setSendToEveryone(e.target.checked)}
        />
        <span style={localStyles.checkboxLabel}>Send to everyone</span>
      </label>

      {!sendToEveryone && (
        <div style={{ marginTop: 10 }}>
          <div style={localStyles.pickLabel}>Pick recipients</div>

          {players.length === 0 ? (
            <p style={styles.muted}>No players yet.</p>
          ) : (
            <div style={localStyles.pillWrap}>
              {players.map((p) => {
                const selected = selectedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleRecipient(p.id)}
                    style={{
                      ...localStyles.pill,
                      ...(selected ? localStyles.pillSelected : null),
                    }}
                  >
                    {p.display_name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Image attachment: show button ONLY when no image, otherwise show thumb + X */}
      <div style={{ marginTop: 10 }}>
        {!imageUrl ? (
          <label style={localStyles.attachButton}>
            Attach image
            <input
              type="file"
              accept="image/*"
              onChange={onPickImage}
              style={{ display: "none" }}
            />
          </label>
        ) : (
          <div style={localStyles.thumbWrap}>
            <img
              src={imageUrl}
              alt="Attached"
              style={localStyles.thumbImg}
              loading="lazy"
            />
            <button
              type="button"
              onClick={onRemoveImage}
              style={localStyles.thumbRemove}
              aria-label="Remove image"
              title="Remove image"
            >
              ×
            </button>
          </div>
        )}

        {imageUploading && (
          <div style={localStyles.uploadingText}>Uploading image…</div>
        )}
      </div>

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

const localStyles = {
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    userSelect: "none",
  },
  checkboxLabel: {
    color: "#111",
    fontWeight: 700,
  },

  pickLabel: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
  },

  pillWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    border: "1px solid rgba(0,0,0,0.18)",
    background: "#fff",
    color: "#111",
    padding: "8px 10px",
    borderRadius: 999,
    cursor: "pointer",
    fontWeight: 600,
  },
  pillSelected: {
    background: "#111",
    color: "#fff",
    border: "1px solid rgba(0,0,0,0.18)",
  },

  attachButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "#fafafa",
    color: "#111",
    cursor: "pointer",
    fontWeight: 700,
  },

  thumbWrap: {
    position: "relative",
    width: 160,
    height: 100,
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#000",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  thumbRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: "28px",
    textAlign: "center",
    fontWeight: 900,
  },

  uploadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
    fontWeight: 600,
  },
};
