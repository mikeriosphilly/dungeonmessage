import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { gmStyles as styles } from "../styles/gmStyles";

import GmHeader from "../components/gm/GmHeader";
import PlayerGrid from "../components/gm/PlayerGrid";
import MessageLog from "../components/gm/MessageLog";
import MessageComposer from "../components/gm/MessageComposer";

const BUCKET = "message-images";

// Upload limits
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

// Soft limit example: 30 image messages per table per hour
const IMAGE_SOFT_LIMIT_PER_HOUR = 30;

export default function GmDashboard() {
  const { gmSecret } = useParams();
  console.log("gmSecret param:", gmSecret);

  const [table, setTable] = useState(null);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState("");

  // copied state
  const [copied, setCopied] = useState(false);

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
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  // Helper: load players (RPC-based, RLS-safe)
  const loadPlayers = useCallback(async () => {
    if (!gmSecret) return;

    setError("");

    const { data, error } = await supabase.rpc("gm_get_players", {
      p_gm_secret: gmSecret,
    });

    if (error) {
      setError(error.message);
      setPlayers([]);
      return;
    }

    setPlayers(data?.players || []);
  }, [gmSecret]);

  // When "send to everyone" is checked, clear specific selections
  useEffect(() => {
    if (sendToEveryone) setSelectedIds([]);
  }, [sendToEveryone]);

  // Fallback: poll players every 2 seconds in case realtime is blocked or times out
  useEffect(() => {
    if (!table?.id) return;

    const t = setInterval(() => {
      loadPlayers();
    }, 2000);

    return () => clearInterval(t);
  }, [table?.id, loadPlayers]);

  // If players change, remove any selectedIds that no longer exist
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => players.some((p) => p.id === id)),
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

  async function getImageCountLastHour(tableId) {
    const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("table_id", tableId)
      .eq("status", "sent")
      .not("image_url", "is", null)
      .gte("sent_at", sinceIso);

    if (error) throw error;
    return count || 0;
  }

  async function onPickImage(e) {
    const input = e.target;
    const file = input.files?.[0];

    // Allow re-picking the same file later
    input.value = "";

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError("Please choose a PNG, JPG, WEBP, or GIF image.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError("That file is too large. Please choose an image under 5MB.");
      return;
    }

    if (table?.id) {
      try {
        const used = await getImageCountLastHour(table.id);
        if (used >= IMAGE_SOFT_LIMIT_PER_HOUR) {
          setError(
            `Image limit reached for this table: ${IMAGE_SOFT_LIMIT_PER_HOUR} per hour. Try again later.`,
          );
          return;
        }
      } catch {
        // Soft limit should never block if counting fails
      }
    }

    setError("");
    setImageFile(file);
    setImageRemoved(false);
  }

  function onRemoveImage() {
    setImageFile(null);
    setImagePreviewUrl("");
    setImageRemoved(true);
  }

  // GM activity helper (RPC-based, RLS-safe)
  async function touchGmActivity() {
    if (!gmSecret) return;
    try {
      await supabase.rpc("touch_gm_activity", { p_gm_secret: gmSecret });
    } catch {
      // never break UI for activity pings
    }
  }

  // Helper: refresh sent log (messages + recipients)
  const refreshLog = useCallback(async () => {
    if (!gmSecret) return;

    const { data, error } = await supabase.rpc("gm_get_log", {
      p_gm_secret: gmSecret,
      p_limit: 50,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setLogItems(data?.messages || []);
  }, [gmSecret]);

  // Helper: refresh drafts list
  const refreshDrafts = useCallback(
    async (tableId) => {
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
    },
    [setDraftItems],
  );

  // 1) Load table by gmSecret (RPC, RLS-safe)
  useEffect(() => {
    if (!gmSecret) return;

    let cancelled = false;

    async function loadTable() {
      setError("");

      const { data, error } = await supabase.rpc("gm_get_table", {
        p_gm_secret: gmSecret,
      });

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setTable(null);
        return;
      }

      const t = data?.table || null;
      console.log("GM table:", t);

      if (!t) {
        setError("Table not found (or access denied by RLS).");
        setTable(null);
        return;
      }

      setTable(t);
      touchGmActivity();
    }

    loadTable();

    return () => {
      cancelled = true;
    };
  }, [gmSecret]);

  // 2) Load current players (initial)
  useEffect(() => {
    if (!table?.id) return;
    loadPlayers();
  }, [table?.id, loadPlayers]);

  // 3) Realtime: broadcast from PlayerFeed that a player joined
  // IMPORTANT: this must match PlayerFeed channel name exactly: `tw:table:${table.id}`
  useEffect(() => {
    if (!table?.id) return;

    let alive = true;

    const ch = supabase
      .channel(`tw:table:${table.id}`, {
        config: { broadcast: { ack: false } },
      })
      .on("broadcast", { event: "player_joined" }, (payload) => {
        console.log("GM got player_joined broadcast:", payload);

        setTimeout(() => {
          if (!alive) return;
          loadPlayers();
        }, 150);
      })
      .subscribe((status) => {
        console.log("GM broadcast channel status:", status);
      });

    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, [table?.id, loadPlayers]);

  // 4) Load sent log + drafts (initial)
  useEffect(() => {
    if (!table?.id) return;

    let alive = true;

    (async () => {
      if (!alive) return;
      setError("");
      await refreshLog();
      await refreshDrafts(table.id);
    })();

    return () => {
      alive = false;
    };
  }, [table?.id, refreshLog, refreshDrafts]);

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
        () => {
          setTimeout(async () => {
            if (!alive) return;
            await refreshLog();
            await refreshDrafts(table.id);
          }, 150);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `table_id=eq.${table.id}`,
        },
        () => {
          setTimeout(async () => {
            if (!alive) return;
            await refreshLog();
            await refreshDrafts(table.id);
          }, 150);
        },
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [table?.id, refreshLog, refreshDrafts]);

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

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      throw new Error("Please choose a PNG, JPG, WEBP, or GIF image.");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(
        "That file is too large. Please choose an image under 5MB.",
      );
    }

    if (table?.id) {
      const used = await getImageCountLastHour(table.id);
      if (used >= IMAGE_SOFT_LIMIT_PER_HOUR) {
        throw new Error(
          `Image limit reached for this table: ${IMAGE_SOFT_LIMIT_PER_HOUR} per hour. Try again later.`,
        );
      }
    }

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

      await touchGmActivity();

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

      const nextImageUrl =
        uploadedUrl ||
        (imagePreviewUrl?.startsWith("http") ? imagePreviewUrl : null);

      if (editingDraftId) {
        const updatePayload = { body: draft.trim(), status: "draft" };
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

      await touchGmActivity();

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
      await touchGmActivity();
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
      const recipientIds = sendToEveryone
        ? players.map((p) => p.id)
        : selectedIds;
      if (!recipientIds.length) throw new Error("No recipients selected.");

      let uploadedUrl = null;
      if (imageFile) uploadedUrl = await uploadImageAndGetUrl(imageFile);

      const imageUrlToSend =
        uploadedUrl ||
        (imagePreviewUrl?.startsWith("http") ? imagePreviewUrl : null);

      const finalImageUrl = imageRemoved ? null : imageUrlToSend;

      const { error } = await supabase.rpc("gm_send_message", {
        p_gm_secret: gmSecret,
        p_body: draft.trim(),
        p_recipient_ids: recipientIds,
        p_image_url: finalImageUrl,
        p_message_id: editingDraftId || null,
      });

      if (error) throw error;

      clearComposer();
      await refreshLog();
      await refreshDrafts(table.id);
    } catch (e) {
      setError(e.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  // Shareable player join link
  const tableCode = table?.code || "";
  const shareUrl = tableCode
    ? `${window.location.origin}/join?code=${tableCode}`
    : "";

  async function copyShareLink() {
    if (!shareUrl) return;

    let copiedOk = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        copiedOk = true;
      }
    } catch {
      // fall through to legacy method
    }

    if (!copiedOk) {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();

      try {
        document.execCommand("copy");
        copiedOk = true;
      } finally {
        document.body.removeChild(ta);
      }
    }

    if (copiedOk) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
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

  const imageUrlForUi = imagePreviewUrl;

  // session expiry (24h after creation)
  const expiresAt = table?.created_at
    ? new Date(table.created_at).getTime() + 24 * 60 * 60 * 1000
    : null;

  const msLeft = expiresAt ? expiresAt - Date.now() : null;
  const showExpiryWarning =
    msLeft !== null && msLeft > 0 && msLeft <= 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Top header row: title + table code card */}
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h1 className="text-4xl font-extrabold tracking-tight text-black">
                {table?.name || "Game Master Dashboard"}
              </h1>
              <p className="mt-2 text-sm font-medium text-gray-600">
                Game Master Dashboard
              </p>
            </div>

            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="text-sm font-semibold text-gray-700">
                Table Code
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="text-2xl font-extrabold tracking-wider text-purple-700">
                  {table?.code || "-----"}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyShareLink}
                    disabled={!shareUrl}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Copy a join link to share with players"
                  >
                    Copy link
                  </button>
                </div>
              </div>

              {copied && (
                <div className="mt-3 inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-gray-900">
                  Copied!
                </div>
              )}
            </div>
          </div>

          {/* Legacy error and warning UI stays intact for now */}
          {error && <p style={styles.error}>{error}</p>}

          {showExpiryWarning && (
            <div style={localStyles.expiryBanner}>
              <div style={localStyles.expiryTitle}>Session ending soon</div>
              <div style={localStyles.expiryBody}>
                This session will automatically end in about{" "}
                {Math.ceil(msLeft / 60000)} minutes.
              </div>
            </div>
          )}

          <div className="mt-8 space-y-8">
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
              saveForLater={saveForLater}
              saveDisabled={saveDisabled}
              savingDraft={savingDraft}
              editingDraftId={editingDraftId}
              clearComposer={clearComposer}
            />

            {/* Drafts */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Drafts</h2>

              {draftItems.length === 0 ? (
                <p style={styles.muted}>
                  No drafts yet. Save something spooky.
                </p>
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
            </div>

            <PlayerGrid tableLoaded={!!table} players={players} error={error} />
            <MessageLog items={logItems} />
          </div>
        </div>
      </main>
    </div>
  );
}

const localStyles = {
  expiryBanner: {
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff7ed",
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  expiryTitle: {
    fontWeight: 800,
    marginBottom: 4,
  },
  expiryBody: {
    color: "#333",
    lineHeight: 1.35,
  },

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
};
