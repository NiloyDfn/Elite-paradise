// Admin → Images: every non-product picture on the storefront in one place.
// Pick a new file for any slot and it replaces the old one everywhere, at once.
// "Use default" removes the custom picture. (Product photos are edited inside
// each product.)

import { useRef, useState } from "react";
import { trpc } from "@/_core/trpc";
import { SITE_IMAGE_SLOTS, type SiteImageSlot } from "@shared/catalog";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024;

export function AdminImages() {
  const utils = trpc.useUtils();
  const settings = trpc.admin.settings.useQuery();
  const uploadUrl = trpc.files.uploadUrl.useMutation();
  const commit = trpc.files.commit.useMutation();
  const setImage = trpc.admin.setSiteImage.useMutation();

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const overrides = (settings.data?.siteImages ?? {}) as Record<string, string>;

  const refresh = () => {
    utils.admin.settings.invalidate();
    utils.catalog.settings.invalidate();
  };

  const change = async (slot: SiteImageSlot, file: File) => {
    setMessage(null);
    if (!ACCEPTED.includes(file.type)) return setMessage({ ok: false, text: "Use a PNG, JPG, WebP, AVIF or GIF picture." });
    if (file.size > MAX_BYTES) return setMessage({ ok: false, text: "That picture is bigger than 8 MB." });
    setBusyKey(slot.key);
    try {
      const signed = await uploadUrl.mutateAsync({ name: file.name, contentType: file.type });
      const res = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) throw new Error(`Upload failed (${res.status}).`);
      await commit.mutateAsync({ key: signed.key, name: file.name });
      await setImage.mutateAsync({ key: slot.key, url: signed.publicPath });
      refresh();
      setMessage({ ok: true, text: `“${slot.label}” changed.` });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setBusyKey(null);
    }
  };

  const reset = async (slot: SiteImageSlot) => {
    setBusyKey(slot.key);
    setMessage(null);
    try {
      await setImage.mutateAsync({ key: slot.key, url: null });
      refresh();
      setMessage({ ok: true, text: `“${slot.label}” is back to the default.` });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setBusyKey(null);
    }
  };

  const groups = Array.from(new Set(SITE_IMAGE_SLOTS.map((s) => s.group)));

  return (
    <div>
      <h1 className="ep-display ep-h3">Website images</h1>
      <p className="text-[13px] text-grey mt-1 max-w-2xl leading-relaxed">
        Change any picture on the website. Click <b>Change picture</b>, choose a file, and it updates on the site
        straight away. Product photos are changed inside each product (Products → Edit).
      </p>

      {message && (
        <p
          role="status"
          className={`mt-4 px-4 py-3 text-[13px] border ${
            message.ok ? "border-gold text-gold-deep bg-gold/10" : "border-destructive/40 text-destructive bg-destructive/5"
          }`}
        >
          {message.text}
        </p>
      )}

      {groups.map((group) => (
        <section key={group} className="mt-10">
          <h2 className="text-[12px] tracking-[0.2em] uppercase text-ink mb-4 pb-2 border-b border-border">{group}</h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {SITE_IMAGE_SLOTS.filter((s) => s.group === group).map((slot) => (
              <SlotCard
                key={slot.key}
                slot={slot}
                custom={overrides[slot.key]}
                busy={busyKey === slot.key}
                onPick={(f) => change(slot, f)}
                onReset={() => reset(slot)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SlotCard({
  slot, custom, busy, onPick, onReset,
}: {
  slot: SiteImageSlot; custom?: string; busy: boolean; onPick: (f: File) => void; onReset: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const src = custom || slot.def;
  return (
    <div className="border border-border bg-white p-4 flex flex-col">
      <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden mb-4">
        <img src={src} alt={slot.label} className="max-w-full max-h-full object-contain" />
      </div>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[14px] text-ink leading-snug">{slot.label}</p>
        <span className={`ep-badge shrink-0 ${custom ? "ep-badge-gold" : "ep-badge-outline"}`}>{custom ? "Custom" : "Default"}</span>
      </div>
      <p className="text-[12px] text-grey mt-1 leading-relaxed flex-1">{slot.hint}</p>
      <div className="mt-4 flex gap-2">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="ep-btn ep-btn-solid ep-btn-sm flex-1">
          {busy ? "Please wait…" : "Change picture"}
        </button>
        {custom && (
          <button type="button" disabled={busy} onClick={onReset} className="ep-btn ep-btn-ghost ep-btn-sm">
            Use default
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onPick(f);
        }}
      />
    </div>
  );
}
