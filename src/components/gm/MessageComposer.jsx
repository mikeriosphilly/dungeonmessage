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

  // drafts (optional, but used by the new UI row)
  saveForLater,
  saveDisabled,
  savingDraft,
  clearComposer,
  editingDraftId,
}) {
  return (
    <div className="mt-4">
      {/* Section label (matches your screenshot vibe) */}
      <div className="text-sm font-medium text-gray-700">Send message</div>

      {/* Send to everyone */}
      <label className="mt-3 flex select-none items-center gap-3 text-sm font-semibold text-gray-900">
        <input
          type="checkbox"
          checked={sendToEveryone}
          onChange={(e) => setSendToEveryone(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
        />
        <span>Send to everyone</span>
      </label>

      {/* Recipient picker */}
      {!sendToEveryone && (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Pick recipients
          </div>

          {players.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">No players yet.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {players.map((p) => {
                const selected = selectedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleRecipient(p.id)}
                    className={[
                      "rounded-full border px-3 py-2 text-sm font-semibold transition",
                      selected
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {p.display_name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Message */}
      <div className="mt-4">
        <div className="text-sm font-medium text-gray-700">Message</div>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type your secret message here..."
          rows={6}
          className="mt-2 w-full resize-y rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-gray-300 focus:bg-white focus:ring-0"
        />
      </div>

      {/* Image attachment preview (shows above the buttons like a proper compose flow) */}
      {(imageUrl || imageUploading) && (
        <div className="mt-3">
          {imageUrl && (
            <div className="relative h-24 w-40 overflow-hidden rounded-2xl border border-gray-200 bg-black">
              <img
                src={imageUrl}
                alt="Attached"
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={onRemoveImage}
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-black/60 text-white"
                aria-label="Remove image"
                title="Remove image"
              >
                ×
              </button>
            </div>
          )}

          {imageUploading && (
            <div className="mt-2 text-xs font-semibold text-gray-500">
              Uploading image...
            </div>
          )}
        </div>
      )}

      {/* Actions row: Attach, Save, Send */}
      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        {/* Attach image */}
        <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 md:w-1/3">
          <span aria-hidden="true">🖼️</span>
          <span>Attach Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={onPickImage}
            className="hidden"
            disabled={imageUploading || sending}
          />
        </label>

        {/* Save as draft */}
        <button
          type="button"
          onClick={saveForLater}
          disabled={saveDisabled}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 md:w-1/3"
          title="Save as draft"
        >
          {savingDraft ? "Saving..." : "Save as Draft"}
        </button>

        {/* Send */}
        <button
          type="button"
          onClick={sendMessage}
          disabled={sendDisabled}
          className="w-full rounded-2xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 md:w-1/3"
          title="Send message"
        >
          {sending ? "Sending..." : "Send Message"}
        </button>
      </div>

      {/* Optional helper row (nice UX): show when editing a draft */}
      {editingDraftId && (
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <div className="font-semibold text-gray-700">
            Editing a saved draft
          </div>

          <button
            type="button"
            onClick={clearComposer}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
