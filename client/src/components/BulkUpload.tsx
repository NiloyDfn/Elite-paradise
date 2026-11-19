// Bulk product upload: pick many photos at once → one product per photo, with
// the name, description, slug and SKU generated automatically. The owner only
// sets a price (and can fix any name/price in the review list before saving).
//
// Names come from the FILE NAME ("gold-pearl-ring.jpg" → "Gold Pearl Ring"),
// because the server does not look at the picture itself. Generic camera names
// (IMG_1234, WhatsApp Image…) get a nice generated name instead.

import { useRef, useState } from "react";
import { trpc } from "@/_core/trpc";
import { CATEGORIES, GENDERS, MATERIALS, STYLES } from "../../../shared/catalog";
import { IconClose } from "./shared";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024;

const SINGULAR: Record<string, string> = {
  necklaces: "Necklace", earrings: "Earrings", rings: "Ring", bracelets: "Bracelet",
  bangles: "Bangles", sets: "Jewelry Set", watches: "Watch", anklets: "Anklet",
  chains: "Chain", accessories: "Accessory",
};
const KEYWORDS: [string, RegExp][] = [
  ["rings", /\bring/i], ["necklaces", /necklace|pendant|locket|choker/i],
  ["earrings", /ear\s?ring|earring|jhumka|stud|hoop/i], ["bracelets", /bracelet/i],
  ["bangles", /bangle|churi|kada/i], ["sets", /\bset\b|combo/i], ["watches", /watch/i],
  ["anklets", /anklet|payel/i], ["chains", /\bchain/i],
];
const ADJ = ["Elegant", "Classic", "Radiant", "Graceful", "Timeless", "Royal", "Dainty", "Luxe"];
const GENERIC = /^(img|image|photo|dsc|pxl|whatsapp|screenshot|picture|pic|received|capture|untitled|new)\b/i;

const title = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const rand = (n: number) => Math.random().toString(36).slice(2, 2 + n);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "product";

function guessCategory(file: string, fallback: string) {
  return KEYWORDS.find(([, re]) => re.test(file))?.[0] ?? fallback;
}

function makeName(file: string, category: string, color: string, index: number) {
  const base = file.replace(/\.[a-z0-9]+$/i, "").replace(/[_\-.]+/g, " ").replace(/\(\d+\)/g, " ");
  const words = base.split(/\s+/).filter((w) => w && !/^\d+$/.test(w));
  const cleaned = words.join(" ").trim();
  if (cleaned.length >= 3 && !GENERIC.test(cleaned)) return title(cleaned.slice(0, 80));
  return `${ADJ[index % ADJ.length]} ${color} ${SINGULAR[category] ?? "Piece"}`.replace("  ", " ");
}

function makeDescription(name: string, category: string, material: string, style: string) {
  const kind = (SINGULAR[category] ?? "piece").toLowerCase();
  return `${name} — a ${style.toLowerCase()} ${kind} finished in ${material}. Lightweight and comfortable, it is made to be worn every day and gifted on special occasions.`;
}

type Row = { key: string; file: string; url: string; name: string; category: string; price: string };

export function BulkUpload({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const uploadUrl = trpc.files.uploadUrl.useMutation();
  const commit = trpc.files.commit.useMutation();
  const createProduct = trpc.admin.createProduct.useMutation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [defaults, setDefaults] = useState({
    price: "", category: "necklaces", gender: "women", material: MATERIALS[0] as string,
    color: "Gold", style: "minimalist", stock: "10", publish: true,
  });
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const upload = async (files: File[]) => {
    setBusy(true);
    setErrors([]);
    const bad: string[] = [];
    const added: Row[] = [];
    let n = rows.length;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setStatus(`Uploading photo ${i + 1} of ${files.length}…`);
      if (!ACCEPTED.includes(f.type)) { bad.push(`${f.name}: not a supported image`); continue; }
      if (f.size > MAX_BYTES) { bad.push(`${f.name}: bigger than 8 MB`); continue; }
      try {
        const signed = await uploadUrl.mutateAsync({ name: f.name, contentType: f.type });
        const res = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": f.type }, body: f });
        if (!res.ok) throw new Error(`upload failed (${res.status})`);
        await commit.mutateAsync({ key: signed.key, name: f.name });
        const category = guessCategory(f.name, defaults.category);
        added.push({
          key: `${f.name}-${rand(5)}`, file: f.name, url: signed.publicPath, category, price: "",
          name: makeName(f.name, category, defaults.color, n++),
        });
      } catch (e) {
        bad.push(`${f.name}: ${e instanceof Error ? e.message : "failed"}`);
      }
    }
    setRows((r) => [...r, ...added]);
    setErrors(bad);
    setStatus(null);
    setBusy(false);
  };

  const create = async () => {
    const fallbackPrice = Number(defaults.price);
    const todo = rows.map((r) => ({ r, price: r.price.trim() ? Number(r.price) : fallbackPrice }));
    if (todo.some((t) => !Number.isFinite(t.price) || t.price <= 0)) {
      setErrors(["Enter a price in 'Price for all' (or in every row)."]);
      return;
    }
    setBusy(true);
    setErrors([]);
    const bad: string[] = [];
    let ok = 0;
    for (let i = 0; i < todo.length; i++) {
      const { r, price } = todo[i];
      setStatus(`Creating product ${i + 1} of ${todo.length}…`);
      const make = () =>
        createProduct.mutateAsync({
          slug: `${slugify(r.name)}-${rand(4)}`,
          name: r.name.trim() || "New piece",
          description: makeDescription(r.name.trim(), r.category, defaults.material, defaults.style),
          price: Math.round(price),
          sku: `EP-${r.category.slice(0, 3).toUpperCase()}-${rand(5).toUpperCase()}`,
          category: r.category,
          gender: defaults.gender,
          material: defaults.material,
          color: defaults.color,
          style: defaults.style,
          images: [r.url],
          stock: Math.max(0, Math.round(Number(defaults.stock) || 0)),
          careInstructions: "Keep away from water and perfume. Store in a soft pouch when not in use.",
          isActive: defaults.publish,
          isNewArrival: true,
        });
      try {
        try { await make(); } catch { await make(); } // one retry for a rare slug/SKU clash
        ok++;
      } catch (e) {
        bad.push(`${r.name}: ${e instanceof Error ? e.message : "failed"}`);
      }
    }
    setBusy(false);
    setStatus(null);
    onDone();
    if (bad.length) { setErrors([`${ok} created, ${bad.length} failed:`, ...bad]); setRows((rs) => rs.filter((x) => bad.some((b) => b.startsWith(x.name)))); }
    else onClose();
  };

  const set = (k: string, v: string | boolean) => setDefaults((d) => ({ ...d, [k]: v }));
  const upd = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-night/70 p-4 md:p-8">
      <div className="bg-ivory w-full max-w-3xl my-4" role="dialog" aria-modal="true" aria-label="Bulk upload">
        <div className="flex items-center justify-between px-6 h-14 border-b border-border sticky top-0 bg-ivory z-10">
          <h2 className="text-[11px] tracking-[0.2em] uppercase">Bulk upload products</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 -mr-2" disabled={busy}><IconClose /></button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-[12px] text-grey leading-relaxed">
            1) Set the details below. 2) Select all your photos at once. 3) Check the names and click Create.
            Name and description are made automatically — each photo becomes one product.
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            <div><label className="ep-label">Price for all (৳)</label>
              <input className="ep-field" inputMode="numeric" value={defaults.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} placeholder="e.g. 2500" /></div>
            <div><label className="ep-label">Stock each</label>
              <input className="ep-field" inputMode="numeric" value={defaults.stock} onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))} /></div>
            <div><label className="ep-label">Default category</label>
              <select className="ep-field" value={defaults.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select></div>
            <div><label className="ep-label">Collection</label>
              <select className="ep-field" value={defaults.gender} onChange={(e) => set("gender", e.target.value)}>
                {GENDERS.map((g) => <option key={g.slug} value={g.slug}>{g.label}</option>)}</select></div>
            <div><label className="ep-label">Material</label>
              <select className="ep-field" value={defaults.material} onChange={(e) => set("material", e.target.value)}>
                {MATERIALS.map((m) => <option key={m}>{m}</option>)}</select></div>
            <div><label className="ep-label">Style</label>
              <select className="ep-field" value={defaults.style} onChange={(e) => set("style", e.target.value)}>
                {STYLES.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}</select></div>
          </div>
          <label className="flex items-center gap-2 text-[12px] cursor-pointer">
            <input type="checkbox" checked={defaults.publish} onChange={(e) => set("publish", e.target.checked)} />
            Show on the website immediately
          </label>

          <div className="border border-dashed border-border bg-white/60 px-5 py-7 text-center">
            <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="ep-btn ep-btn-solid">
              Select photos (many at once)
            </button>
            <p className="text-[10.5px] text-grey mt-3">
              Tip: name files like <b>gold-pearl-ring.jpg</b> — the product name and category are taken from it.
            </p>
            <input ref={inputRef} type="file" accept={ACCEPTED.join(",")} multiple className="sr-only"
              onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ""; if (f.length) void upload(f); }} />
          </div>

          {status && <p className="text-[12px] text-gold-deep">{status}</p>}
          {errors.length > 0 && (
            <ul className="text-[11.5px] text-destructive border border-destructive/30 bg-destructive/5 p-3 space-y-1">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}

          {rows.length > 0 && (
            <div>
              <p className="ep-label">{rows.length} products ready — edit name, category or price if needed</p>
              <ul className="divide-y divide-border border border-border bg-white">
                {rows.map((r) => (
                  <li key={r.key} className="flex items-center gap-3 p-3">
                    <img src={r.url} alt="" className="w-14 h-14 object-cover shrink-0 bg-muted" />
                    <div className="grid sm:grid-cols-[1fr_130px_90px] gap-2 flex-1 min-w-0">
                      <input className="ep-field !py-1.5 text-[13px]" value={r.name} onChange={(e) => upd(r.key, { name: e.target.value })} aria-label="Product name" />
                      <select className="ep-field !py-1.5 text-[12px]" value={r.category} onChange={(e) => upd(r.key, { category: e.target.value })} aria-label="Category">
                        {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select>
                      <input className="ep-field !py-1.5 text-[13px]" inputMode="numeric" placeholder={defaults.price || "Price"} value={r.price}
                        onChange={(e) => upd(r.key, { price: e.target.value.replace(/\D/g, "") })} aria-label="Price" />
                    </div>
                    <button type="button" aria-label="Remove" className="p-2 text-grey hover:text-ink" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}><IconClose /></button>
                  </li>
                ))}
              </ul>
              <button type="button" disabled={busy} onClick={create} className="ep-btn ep-btn-solid w-full mt-5">
                {busy ? "Please wait…" : `Create ${rows.length} products`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
