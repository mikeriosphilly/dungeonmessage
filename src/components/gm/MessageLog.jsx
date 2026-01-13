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
            const time = new Date(m.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

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
                    marginBottom: 6,
                    fontSize: 12,
                    color: "#666",
                  }}
                >
                  <div>{recipientsLabel}</div>
                  <div>{time}</div>
                </div>

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
