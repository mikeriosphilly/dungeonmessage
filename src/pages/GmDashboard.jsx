import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { gmStyles as styles } from "../styles/gmStyles";

import GmHeader from "../components/gm/GmHeader";
import PlayerGrid from "../components/gm/PlayerGrid";
import MessageLog from "../components/gm/MessageLog";
import MessageComposer from "../components/gm/MessageComposer";

const BUCKET = "message-images";

export default function GmDashboard() {
  const { code } = useParams();
  const tableCode = useMemo(() => (code || "").toUpperCase(), [code]);

  const [table, setTable] = useState(null);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState("");

  // composer state
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendToEveryone, setSendToEveryone] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // image attachment state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageRemoved, setImageRemoved] = useState(false); // important when editing draft

  // message log state
  const [logItems, setLogItems] = useState([]);

  // drafts (save for later)
  const [draftItems, setDraftItems] = useState([]);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);

  function toggleRecipient(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // When "send to everyone" is checked, clear specific selections
  useEffect(() => {
    if (sendToEveryone) setSelectedIds([]);
  }, [sendToEveryone]);

  // If players change, remove any selectedIds that no longer exist
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => players.some((p) => p.id === id))
    );
  }, [players]);

  // When imageFile changes, make a preview URL
  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function clearImage() {
    setImageFile(null);
    setImagePreviewUrl("");
    setImageRemoved(false);
  }

  function onPickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageRemoved(false);
  }

  function onRemoveImage() {
    setImageFile(null);
    setImagePreviewUrl("");
    setImageRemoved(true);
  }

  // 1) Load table by code
  useEffect(() => {
    let ignore = false;

    async function loadTable() {
      setError("");

      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("code", tableCode)
        .eq("status", "active")
        .single();

      if (ignore) return;

      if (error) setError(error.message);
      else setTable(data);
    }

    if (tableCode) loadTable();

    return () => {
      ignore = true;
    };
  }, [tableCode]);

  // 2) Load current players (initial)
  useEffect(() => {
    if (!table?.id) return;

    let ignore = false;

    async function loadPlayers() {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("table_id", table.id)
        .order("created_at", { ascending: true });

      if (ignore) return;

      if (error) setError(error.message);
      else setPlayers(data || []);
    }

    loadPlayers();

    return () => {
      ignore = true;
    };
  }, [table?.id]);

  // 3) Realtime: players join (INSERT) and updates (UPDATE)
  useEffect(() => {
    if (!table?.id) return;

    const channel = supabase
      .channel(`players:${table.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "players",
          filter: `table_id=eq.${table.id}`,
        },
        (payload) => {
          const newPlayer = payload.new;
          setPlayers((prev) => {
            if (prev.some((p) => p.id === newPlayer.id)) return prev;
            return [...prev, newPlayer];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "players",
          filter: `table_id=eq.${table.id}`,
        },
        (payload) => {
          const updated = payload.new;
          setPlayers((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table?.id]);

  // Helper: refresh sent log (messages + recipients)
  async function refreshLog(tableId) {
    const { data: msgs, error: msgErr } = await supabase
      .from("messages")
      .select("id, body, created_at, status, sent_at, image_url")
      .eq("table_id", tableId)
      .eq("status", "sent")
      .order("sent_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (msgErr) {
      setError(msgErr.message);
      return;
    }

    const messageIds = (msgs || []).map((m) => m.id);
    if (!messageIds.length) {
      setLogItems([]);
      return;
    }

    const { data: recs, error: recErr } = await supabase
      .from("message_recipients")
      .select("message_id, players ( id, display_name )")
      .in("message_id", messageIds);

    if (recErr) {
      setError(recErr.message);
      return;
    }

    const byMsg = new Map();
    (recs || []).forEach((r) => {
      const arr = byMsg.get(r.message_id) || [];
      const p = r.players;
      if (p?.id) arr.push({ id: p.id, display_name: p.display_name });
      byMsg.set(r.message_id, arr);
    });

    const merged = (msgs || []).map((m) => ({
      ...m,
      recipients: byMsg.get(m.id) || [],
    }));

    setLogItems(merged);
  }

  // Helper: refresh drafts list
  async function refreshDrafts(tableId) {
    const { data, error } = await supabase
      .from("messages")
      .select("id, body, created_at, status, image_url")
      .eq("table_id", tableId)
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setError(error.message);
      return;
    }

    setDraftItems(data || []);
  }

  // 4) Load sent log + drafts (initial)
  useEffect(() => {
    if (!table?.id) return;

    async function loadAll() {
      setError("");
      await refreshLog(table.id);
      await refreshDrafts(table.id);
    }

    loadAll();
  }, [table?.id]);

  // 5) Realtime: when a message changes, refresh both lists
  useEffect(() => {
    if (!table?.id) return;

    let alive = true;

    const channel = supabase
      .channel(`messages:${table.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `table_id=eq.${table.id}`,
        },
        async () => {
          setTimeout(async () => {
            if (!alive) return;
            await refreshLog(table.id);
            await refreshDrafts(table.id);
          }, 150);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `table_id=eq.${table.id}`,
        },
        async () => {
          setTimeout(async () => {
            if (!alive) return;
            await refreshLog(table.id);
            await refreshDrafts(table.id);
          }, 150);
        }
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [table?.id]);

  function clearComposer() {
    setDraft("");
    setEditingDraftId(null);
    if (!sendToEveryone) setSelectedIds([]);
    clearImage();
  }

  // Upload helper: returns a public URL string
  async function uploadImageAndGetUrl(file) {
    if (!table?.id) throw new Error("Missing table.");
    if (!file) return null;

    setImageUploading(true);

    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const safeExt = ext.replace(/[^a-z0-9]/g, "") || "png";
      const fileName = `${crypto.randomUUID()}.${safeExt}`;
      const path = `${table.id}/${fileName}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = data?.publicUrl;

      if (!publicUrl) throw new Error("Upload succeeded but no public URL.");

      return publicUrl;
    } finally {
      setImageUploading(false);
    }
  }

  async function saveForLater() {
    if (!table?.id) return;
    if (!draft.trim() && !imageFile && !imagePreviewUrl) return;

    setSavingDraft(true);
    setError("");

    try {
      let uploadedUrl = null;
      if (imageFile) uploadedUrl = await uploadImageAndGetUrl(imageFile);

      // Determine what to store for image_url
      const nextImageUrl =
        uploadedUrl ||
        (imagePreviewUrl?.startsWith("http") ? imagePreviewUrl : null);

      if (editingDraftId) {
        const updatePayload = {
          body: draft.trim(),
          status: "draft",
        };

        if (uploadedUrl) updatePayload.image_url = uploadedUrl;
        else if (imageRemoved) updatePayload.image_url = null;

        const { error: upErr } = await supabase
          .from("messages")
          .update(updatePayload)
          .eq("id", editingDraftId)
          .eq("table_id", table.id);

        if (upErr) throw upErr;
      } else {
        const { error: insErr } = await supabase.from("messages").insert({
          table_id: table.id,
          kind: "text",
          body: draft.trim(),
          status: "draft",
          image_url: nextImageUrl,
        });

        if (insErr) throw insErr;
      }

      clearComposer();
      await refreshDrafts(table.id);
    } catch (e) {
      setError(e.message || "Failed to save draft.");
    } finally {
      setSavingDraft(false);
    }
  }

  async function loadDraftIntoComposer(item) {
    setDraft(item.body || "");
    setEditingDraftId(item.id);

    // Show existing image URL (if any)
    setImageFile(null);
    setImagePreviewUrl(item.image_url || "");
    setImageRemoved(false);

    setSelectedIds([]);
  }

  async function deleteDraft(itemId) {
    if (!table?.id) return;

    setError("");

    try {
      const { error } = await supabase
        .from("messages")
        .update({ status: "deleted" })
        .eq("id", itemId)
        .eq("table_id", table.id);

      if (error) throw error;

      if (editingDraftId === itemId) clearComposer();

      await refreshDrafts(table.id);
    } catch (e) {
      setError(e.message || "Failed to delete draft.");
    }
  }

  async function sendMessage() {
    if (!table?.id) return;
    if (!draft.trim() && !imageFile && !imagePreviewUrl) return;

    setSending(true);
    setError("");

    try {
      const recipientPlayers = sendToEveryone
        ? players
        : players.filter((p) => selectedIds.includes(p.id));

      if (!recipientPlayers.length) throw new Error("No recipients selected.");

      let uploadedUrl = null;
      if (imageFile) uploadedUrl = await uploadImageAndGetUrl(imageFile);

      let msgId = editingDraftId;

      if (editingDraftId) {
        const updatePayload = {
          body: draft.trim(),
          status: "sent",
          sent_at: new Date().toISOString(),
          send_at: null,
        };

        if (uploadedUrl) updatePayload.image_url = uploadedUrl;
        else if (imageRemoved) updatePayload.image_url = null;

        const { error: upErr } = await supabase
          .from("messages")
          .update(updatePayload)
          .eq("id", editingDraftId)
          .eq("table_id", table.id);

        if (upErr) throw upErr;
      } else {
        const imageUrlToSave =
          uploadedUrl ||
          (imagePreviewUrl?.startsWith("http") ? imagePreviewUrl : null);

        const { data: msg, error: msgErr } = await supabase
          .from("messages")
          .insert({
            table_id: table.id,
            kind: "text",
            body: draft.trim(),
            status: "sent",
            sent_at: new Date().toISOString(),
            image_url: imageUrlToSave,
          })
          .select("id")
          .single();

        if (msgErr) throw msgErr;
        msgId = msg.id;
      }

      const rows = recipientPlayers.map((p) => ({
        message_id: msgId,
        player_id: p.id,
      }));

      const { error: recErr } = await supabase
        .from("message_recipients")
        .insert(rows);

      if (recErr) throw recErr;

      clearComposer();
      await refreshLog(table.id);
      await refreshDrafts(table.id);
    } catch (e) {
      setError(e.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  const sendDisabled =
    sending ||
    imageUploading ||
    (!draft.trim() && !imageFile && !imagePreviewUrl) ||
    !players.length ||
    (!sendToEveryone && selectedIds.length === 0);

  const saveDisabled =
    savingDraft ||
    imageUploading ||
    (!draft.trim() && !imageFile && !imagePreviewUrl) ||
    !table?.id;

  const imageUrlForUi = imageFile ? imagePreviewUrl : imagePreviewUrl;

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <GmHeader tableName={table?.name} tableCode={tableCode} />

        {error && <p style={styles.error}>{error}</p>}

        <MessageComposer
          players={players}
          draft={draft}
          setDraft={setDraft}
          sending={sending}
          sendDisabled={sendDisabled}
          sendMessage={sendMessage}
          sendToEveryone={sendToEveryone}
          setSendToEveryone={setSendToEveryone}
          selectedIds={selectedIds}
          toggleRecipient={toggleRecipient}
          imageUrl={imageUrlForUi}
          onPickImage={onPickImage}
          onRemoveImage={onRemoveImage}
          imageUploading={imageUploading}
        />

        {/* Drafts */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Drafts</h2>

          {draftItems.length === 0 ? (
            <p style={styles.muted}>No drafts yet. Save something spooky.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {draftItems.map((d) => (
                <div key={d.id} style={localStyles.draftCard}>
                  <button
                    type="button"
                    onClick={() => loadDraftIntoComposer(d)}
                    style={localStyles.draftMainButton}
                    title="Load this draft into the composer"
                  >
                    <div style={localStyles.draftMeta}>
                      {new Date(d.created_at).toLocaleString([], {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {d.image_url ? "  •  📷" : ""}
                    </div>
                    <div style={localStyles.draftBody}>
                      {(d.body || "").trim() || "(empty draft)"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteDraft(d.id)}
                    style={localStyles.draftDelete}
                    title="Delete draft"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Optional: show a small helper when editing */}
          {editingDraftId && (
            <div style={localStyles.editingHint}>
              Editing a draft. Your attached image can be removed with the X.
            </div>
          )}

          {/* Save-for-later button stays in your UI elsewhere if you want it here;
              leaving it out since you already had it working previously. */}
          <div style={localStyles.actionRow}>
            <button
              onClick={saveForLater}
              disabled={saveDisabled}
              style={{
                ...styles.button,
                flex: 1,
                opacity: saveDisabled ? 0.6 : 1,
                cursor: saveDisabled ? "not-allowed" : "pointer",
              }}
            >
              {savingDraft ? "Saving..." : "Save for later"}
            </button>

            {editingDraftId && (
              <button
                type="button"
                onClick={clearComposer}
                style={{
                  ...styles.button,
                  flex: 1,
                  background: "#fafafa",
                  color: "#111",
                }}
              >
                Cancel editing
              </button>
            )}
          </div>
        </div>

        <PlayerGrid tableLoaded={!!table} players={players} error={error} />
        <MessageLog items={logItems} />
      </div>
    </div>
  );
}

const localStyles = {
  draftCard: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    alignItems: "stretch",
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
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
    color: "#666",
  },
  draftBody: {
    color: "#111",
    whiteSpace: "pre-wrap",
    lineHeight: 1.35,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
  },
  draftDelete: {
    border: "1px solid rgba(0,0,0,0.18)",
    background: "#fafafa",
    color: "#111",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 700,
    height: "100%",
    whiteSpace: "nowrap",
  },
  editingHint: {
    marginTop: 10,
    fontSize: 12,
    color: "#666",
  },
  actionRow: {
    display: "flex",
    gap: 10,
    marginTop: 12,
  },
};
