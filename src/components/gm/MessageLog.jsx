export default function MessageLog({ items }) {
  return (
    <div style={{ marginTop: 18 }}>
      <h2 style={{ margin: "0 0 10px 0", fontSize: 18, color: "#111" }}>
        Message log
      </h2>

      {!items?.length ? (
        <p style={{ margin: 0, color: "#666" }}>No messages yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((m) => {
            // Prefer sent_at for correct ordering/meaning, fall back to created_at
            const ts = m.sent_at || m.created_at;
            const time = ts
              ? new Date(ts).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            const recipientNames = (m.recipients || [])
              .map((r) => r.display_name)
              .filter(Boolean);

            const recipientsLabel =
              recipientNames.length === 0
                ? "Recipients: (unknown)"
                : recipientNames.length === 1
                ? `To: ${recipientNames[0]}`
                : `To: ${recipientNames.join(", ")}`;

            return (
              <div
                key={m.id}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 8,
                    fontSize: 12,
                    color: "#666",
                  }}
                >
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    {recipientsLabel}
                  </div>
                  <div style={{ whiteSpace: "nowrap" }}>{time}</div>
                </div>

                {/* Thumbnail preview if image_url exists */}
                {m.image_url && (
                  <a
                    href={m.image_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "block",
                      marginBottom: 10,
                      textDecoration: "none",
                    }}
                    title="Open image"
                  >
                    <img
                      src={m.image_url}
                      alt="Message attachment"
                      style={{
                        width: 120,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 12,
                        border: "1px solid rgba(0,0,0,0.12)",
                        background: "#000",
                        display: "block",
                      }}
                      loading="lazy"
                    />
                  </a>
                )}

                <div
                  style={{
                    color: "#111",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.45,
                  }}
                >
                  {m.body || <span style={{ color: "#666" }}>(No body)</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
