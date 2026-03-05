import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

import PlayerGrid from "../components/gm/PlayerGrid";
import MessageLog from "../components/gm/MessageLog";
import MessageComposer from "../components/gm/MessageComposer";
import { avatarSrcFromKey } from "../lib/avatars";
import { Send, Trash2 } from "lucide-react";
import AppHeader from "../components/AppHeader";
import bgPaper from "../assets/bg_paper.jpg";
import bgWood from "../assets/bg_wood.jpg";

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

function IconCopy(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      {...props}
    >
      <path d="M9 9h10v12H9z" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconShare(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v14" />
    </svg>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(151,130,98,0.28))" }} />
      <span style={{ fontFamily: "Lato, sans-serif", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#B79E81" }}>
        {children}
      </span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(151,130,98,0.28))" }} />
    </div>
  );
}

export default function GmDashboard() {
  useEffect(() => {
    document.body.style.backgroundImage = `url(${bgPaper})`;
    document.body.style.backgroundSize = "420px 420px";
    return () => {
      document.body.style.backgroundImage = `url(${bgWood})`;
      document.body.style.backgroundSize = "960px auto";
    };
  }, []);

  const [sendingDraftId, setSendingDraftId] = useState(null);
  const { gmSecret } = useParams();
  const navigate = useNavigate();

  const [table, setTable] = useState(null);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState("");

  // expired state
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!expired) return;

    const t = setTimeout(() => {
      navigate("/", { replace: true });
    }, 5000);

    return () => clearTimeout(t);
  }, [expired, navigate]);

  // copied state
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // drafts accordion
  const [draftsOpen, setDraftsOpen] = useState(false);

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
      const msg = (error.message || "").toLowerCase();

      // When the table is purged, gm RPCs will start failing
      if (
        msg.includes("invalid gm secret") ||
        msg.includes("table not found")
      ) {
        setExpired(true);
        return;
      }

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

    const t = setInterval(async () => {
      // 1) Ping table existence
      const { data, error } = await supabase.rpc("gm_get_table", {
        p_gm_secret: gmSecret,
      });

      const tRow = data?.table || null;

      if (error || !tRow) {
        setExpired(true);
        return;
      }

      // 2) Still alive, refresh players
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

  useEffect(() => {
    if (sendToEveryone) return;
    if (!players.length) return;

    if (selectedIds.length === players.length) {
      setSendToEveryone(true);
    }
  }, [selectedIds, players, sendToEveryone]);

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
  const refreshDrafts = useCallback(async () => {
    if (!gmSecret) return;

    const { data, error } = await supabase.rpc("gm_get_drafts", {
      p_gm_secret: gmSecret,
      p_limit: 50,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setDraftItems(data || []);
  }, [gmSecret]);

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

      if (!t) {
        setExpired(true);
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
      .on("broadcast", { event: "player_joined" }, () => {
        setTimeout(() => {
          if (!alive) return;
          loadPlayers();
        }, 150);
      })
      .subscribe();

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
      await refreshDrafts();
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
            await refreshDrafts();
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
            await refreshDrafts();
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

    const draftSendToEveryone = !!sendToEveryone;
    const draftRecipientIds = draftSendToEveryone ? null : selectedIds;

    try {
      let uploadedUrl = null;
      if (imageFile) uploadedUrl = await uploadImageAndGetUrl(imageFile);

      const nextImageUrl =
        uploadedUrl ||
        (imagePreviewUrl?.startsWith("http") ? imagePreviewUrl : null);

      const draftSendToEveryone = !!sendToEveryone;
      const draftRecipientIds = draftSendToEveryone ? null : selectedIds;

      const { data: draftId, error: saveErr } = await supabase.rpc(
        "gm_save_draft",
        {
          p_gm_secret: gmSecret,
          p_body: draft.trim(),
          p_image_url: imageRemoved ? null : nextImageUrl,
          p_message_id: editingDraftId || null,
          p_draft_send_to_everyone: draftSendToEveryone,
          p_draft_recipient_ids: draftRecipientIds,
        },
      );

      if (saveErr) throw saveErr;

      // optional: keep editingDraftId in sync if you want
      // if (!editingDraftId && draftId) setEditingDraftId(draftId);

      await touchGmActivity();

      clearComposer();
      await refreshDrafts();
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

    const toEveryone = item?.draft_send_to_everyone ?? true;
    setSendToEveryone(toEveryone);

    const ids = Array.isArray(item?.draft_recipient_ids)
      ? item.draft_recipient_ids
      : [];
    setSelectedIds(toEveryone ? [] : ids);
  }

  async function deleteDraft(itemId) {
    setError("");

    try {
      const { error } = await supabase.rpc("gm_delete_draft", {
        p_gm_secret: gmSecret,
        p_message_id: itemId,
      });

      if (error) throw error;

      if (editingDraftId === itemId) clearComposer();

      await refreshDrafts();
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
        p_send_to_everyone: sendToEveryone,
      });

      if (error) throw error;

      clearComposer();
      await refreshLog();
      await refreshDrafts();
    } catch (e) {
      setError(e.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  async function sendDraft(draft) {
    if (!table?.id) return;
    if (sendingDraftId === draft.id) return;

    setSendingDraftId(draft.id);
    setError("");

    try {
      const recipientIds = draft.draft_send_to_everyone
        ? players.map((p) => p.id)
        : Array.isArray(draft.draft_recipient_ids)
          ? draft.draft_recipient_ids
          : [];

      if (!recipientIds.length) {
        throw new Error("Draft has no recipients.");
      }

      const { error } = await supabase.rpc("gm_send_message", {
        p_gm_secret: gmSecret,
        p_body: draft.body || "",
        p_recipient_ids: recipientIds,
        p_image_url: draft.image_url || null,
        p_message_id: draft.id,
      });

      if (error) throw error;

      await refreshLog();
      await refreshDrafts();
    } catch (e) {
      setError(e.message || "Failed to send draft.");
    } finally {
      setSendingDraftId(null);
    }
  }

  // Shareable player join link
  const tableCode = table?.code || "";
  const shareUrl = tableCode
    ? `${window.location.origin}/join?code=${tableCode}`
    : "";

  async function copyRoomCode() {
    if (!table?.code) return;
    try {
      await navigator.clipboard.writeText(table.code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = table.code;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand("copy"); } finally { document.body.removeChild(ta); }
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  }

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
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    }
  }

  async function nativeShare() {
    if (!shareUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join TableWhisper",
          text: table?.name ? `Join my table: ${table.name}!` : "Join my table!",
          url: shareUrl,
        });
        return;
      } catch {
        // user cancelled or share failed
      }
    }

    // fallback: copy
    await copyShareLink();
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

  const playerCount = players?.length || 0;

  const playerChips = useMemo(() => {
    const list = Array.isArray(players) ? players : [];
    return list.slice(0, 6).map((p, idx) => {
      const name =
        p?.display_name || p?.name || p?.username || `Player ${idx + 1}`;

      const avatarUrl = p?.avatar_key ? avatarSrcFromKey(p.avatar_key) : "";

      const initials = String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join("");

      return { id: p?.id ?? `${idx}`, name, avatarUrl, initials };
    });
  }, [players]);

  return (
    <div className="min-h-screen">
      <AppHeader connected={!!table} />
      {expired && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.75)" }}
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/70 p-6 text-center shadow-2xl">
            <div className="text-xl font-extrabold text-white">
              This table has expired
            </div>
            <div className="mt-2 text-sm text-white/80">
              Redirecting you to the home page...
            </div>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Session name + table code — stacks on mobile */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1
            className="min-w-0"
            style={{ fontFamily: "var(--tw-font-heading)", lineHeight: 1.1, fontSize: "clamp(2rem, 6vw, 3rem)" }}
          >
            {table?.name}
          </h1>

          {/* Table code card */}
          <div
            className="flex-shrink-0 rounded-xl border px-4 py-3"
            style={{
              borderColor: "var(--tw-border)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--tw-text-muted)" }}>
              Table Code
            </div>
            <div className="mt-1 flex items-center gap-3">
              <div className="text-2xl font-extrabold tracking-widest" style={{ color: "var(--tw-accent)", fontFamily: "var(--tw-font-heading)" }}>
                {table?.code || "-----"}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={copyRoomCode}
                  disabled={!table?.code}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ borderColor: "var(--tw-border)", background: "rgba(255,255,255,0.04)", color: "var(--tw-text-muted)" }}
                  title="Copy join link"
                >
                  <IconCopy />
                </button>
                <button
                  type="button"
                  onClick={nativeShare}
                  disabled={!shareUrl}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ borderColor: "var(--tw-border)", background: "rgba(255,255,255,0.04)", color: "var(--tw-text-muted)" }}
                  title="Share"
                >
                  <IconShare />
                </button>
              </div>
            </div>
            {(copiedCode || copiedLink) && (
              <div className="mt-1.5 text-xs font-semibold" style={{ color: "#B79E81" }}>
                {copiedCode ? "Copied room code!" : "Copied share link!"}
              </div>
            )}
          </div>
        </div>

        {/* Errors */}
        {error && (
          <div
            className="mt-5 rounded-xl border px-4 py-3 text-sm font-medium"
            style={{
              borderColor: "rgba(139,32,32,0.5)",
              background: "rgba(80,10,10,0.55)",
              color: "#f5a0a0",
            }}
          >
            {error}
          </div>
        )}

        {/* Expiry warning */}
        {showExpiryWarning && (
          <div
            className="mt-5 rounded-xl border px-4 py-3"
            style={{
              borderColor: "rgba(180,120,20,0.4)",
              background: "rgba(80,50,5,0.55)",
            }}
          >
            <div className="text-sm font-extrabold" style={{ color: "#e8c46a" }}>
              Session ending soon
            </div>
            <div className="mt-0.5 text-sm" style={{ color: "#c4a050" }}>
              This session will automatically end in about{" "}
              {Math.ceil(msLeft / 60000)} minutes.
            </div>
          </div>
        )}

        <div className="mt-8 space-y-5">
          {/* Players strip */}
          <div
            className="rounded-xl border px-5 py-4"
            style={{
              borderColor: "var(--tw-border)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <SectionLabel>
              {playerCount} {playerCount === 1 ? "Player at the Table" : "Players at the Table"}
            </SectionLabel>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {playerChips.length === 0 ? (
                <span className="text-sm" style={{ color: "var(--tw-text-muted)" }}>
                  Waiting for players to join...
                </span>
              ) : (
                playerChips.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-full border pr-3"
                    style={{
                      borderColor: "rgba(151,130,98,0.3)",
                      background: "rgba(255,255,255,0.04)",
                    }}
                    title={p.name}
                  >
                    <div
                      className="h-8 w-8 overflow-hidden rounded-full flex-shrink-0"
                      style={{ border: "1.5px solid rgba(151,130,98,0.5)" }}
                    >
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-xs font-extrabold"
                          style={{ color: "var(--tw-text-muted)", background: "rgba(255,255,255,0.06)" }}
                        >
                          {p.initials || "?"}
                        </div>
                      )}
                    </div>
                    <span className="text-sm" style={{ color: "var(--tw-text)" }}>
                      {p.name}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="hidden">
              <PlayerGrid
                tableLoaded={!!table}
                players={players}
                error={error}
              />
            </div>
          </div>

          {/* Send a Message card */}
          <div
            className="rounded-xl border px-5 py-5"
            style={{
              borderColor: "var(--tw-border)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 0, textAlign: "center" }}>
              Send a Message
            </h2>

            <div className="mt-5">
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
            </div>
          </div>

          {/* Drafted Messages accordion */}
          <div
            className="rounded-xl border"
            style={{
              borderColor: "var(--tw-border)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <button
              type="button"
              onClick={() => setDraftsOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <h2 style={{ margin: 0, fontSize: "1.45rem" }}>
                  Drafted Messages
                </h2>
                <div
                  className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "var(--tw-text-muted)",
                    border: "1px solid var(--tw-border)",
                  }}
                >
                  {draftItems.length}
                </div>
              </div>

              <div
                className={`transition-transform ${draftsOpen ? "rotate-180" : ""}`}
                style={{ color: "var(--tw-text-muted)", flexShrink: 0 }}
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </button>

            {draftsOpen && (
              <div
                className="border-t px-5 py-4"
                style={{ borderColor: "var(--tw-border)" }}
              >
                {draftItems.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--tw-text-muted)" }}>
                    No drafts yet.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {draftItems.map((d) => (
                      <div
                        key={d.id}
                        className="grid cursor-pointer grid-cols-[1fr_auto] items-start gap-3 rounded-xl border p-4 transition hover:-translate-y-[1px] hover:shadow-lg"
                        style={{
                          borderColor: "var(--tw-border)",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => loadDraftIntoComposer(d)}
                          className="cursor-pointer text-left"
                          title="Load this draft into the composer"
                        >
                          <div
                            className="text-xs font-semibold"
                            style={{ color: "var(--tw-text-muted)" }}
                          >
                            To:{" "}
                            {d.draft_send_to_everyone
                              ? "Everyone"
                              : Array.isArray(d.draft_recipient_ids) &&
                                  d.draft_recipient_ids.length
                                ? d.draft_recipient_ids
                                    .map(
                                      (id) =>
                                        players.find((p) => p.id === id)
                                          ?.display_name,
                                    )
                                    .filter(Boolean)
                                    .join(", ")
                                : "(no one selected)"}
                            {d.image_url ? "  •  📷" : ""}
                          </div>

                          <div
                            className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm"
                            style={{ color: "var(--tw-text)" }}
                          >
                            {(d.body || "").trim() || "(empty draft)"}
                          </div>
                        </button>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendDraft(d);
                            }}
                            className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl transition hover:shadow-lg hover:-translate-y-[1px]"
                            style={{ background: "#69583D" }}
                            title="Send this draft"
                          >
                            <Send size={16} color="#fff" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDraft(d.id);
                            }}
                            className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl transition hover:shadow-lg hover:-translate-y-[1px]"
                            style={{ background: "var(--tw-accent-2)" }}
                            title="Delete draft"
                          >
                            <Trash2 size={16} color="#fff" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Message Log */}
          <div
            className="rounded-xl border px-5 py-5"
            style={{
              borderColor: "var(--tw-border)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 0 }}>Message Log</h2>
            <div className="mt-4">
              <MessageLog items={logItems} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
