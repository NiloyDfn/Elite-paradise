// Full-screen search overlay with live results.
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/_core/trpc";
import { formatTaka, effectivePrice } from "@shared/catalog";
import { useBodyLock, useDebounced, useEscape } from "../lib/hooks";
import { gsap, motionOk } from "../lib/anim";
import { IconClose, IconSearch } from "./shared";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [term, setTerm] = useState("");
  const debounced = useDebounced(term, 260);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useBodyLock(open);
  useEscape(onClose, open);

  // Fade + lift the sheet in; the results list cascades behind it.
  useEffect(() => {
    if (!open || !rootRef.current || !motionOk()) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(rootRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }).fromTo(
      rootRef.current.querySelectorAll("[data-search-step]"),
      { y: 14, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06 },
      "-=0.16",
    );
    return () => {
      tl.kill();
    };
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    else setTerm("");
  }, [open]);

  const { data, isFetching } = trpc.catalog.products.useQuery(
    { search: debounced, limit: 8 },
    { enabled: open && debounced.trim().length > 1 },
  );

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      className="ep-glass-panel fixed inset-0 z-[75] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div className="ep-shell pt-6 md:pt-10">
        <div data-search-step className="flex items-center justify-between mb-8">
          <p className="ep-eyebrow">Search</p>
          <button type="button" onClick={onClose} aria-label="Close search" className="p-2 -mr-2 text-ink">
            <IconClose />
          </button>
        </div>

        <div data-search-step className="flex items-center gap-4 border-b border-ink pb-4">
          <IconSearch className="w-5 h-5 text-grey shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search necklaces, rings, gifts…"
            aria-label="Search products"
            className="flex-1 bg-transparent border-0 outline-none font-serif text-[clamp(1.3rem,3vw,2rem)] text-ink placeholder:text-grey/60"
          />
        </div>

        <div data-search-step className="mt-8 pb-16">
          {debounced.trim().length <= 1 ? (
            <div>
              <p className="ep-eyebrow mb-4">Popular</p>
              <div className="flex flex-wrap gap-2">
                {["Pearl", "Gold", "Rings", "Couple", "Gift sets", "Watches"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTerm(t)}
                    className="border border-border px-4 py-2 text-[11px] tracking-[0.12em] uppercase text-ink hover:border-ink transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : isFetching ? (
            <p className="ep-body">Searching…</p>
          ) : !data?.length ? (
            <div>
              <p className="ep-body">
                No pieces match “{debounced}”. Try a different word, or browse the full collection.
              </p>
              <Link href="/collections/shop-all" onClick={onClose} className="ep-btn ep-btn-ghost mt-6">
                Shop all
              </Link>
            </div>
          ) : (
            <>
              <p className="ep-eyebrow mb-5">
                {data.length} {data.length === 1 ? "result" : "results"}
              </p>
              <ul className="divide-y divide-border">
                {data.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/product/${p.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-5 py-4 group"
                    >
                      <div className="w-16 h-20 shrink-0 bg-muted overflow-hidden">
                        {p.images?.[0] && (
                          <img src={p.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-[15px] text-ink group-hover:text-gold-deep transition-colors">
                          {p.name}
                        </p>
                        <p className="text-[12px] text-grey mt-0.5 capitalize">{p.category}</p>
                      </div>
                      <span className="text-[13px] text-ink shrink-0">
                        {formatTaka(effectivePrice(p))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/collections/shop-all?q=${encodeURIComponent(debounced)}`}
                onClick={onClose}
                className="ep-link mt-8 inline-block"
              >
                See all results
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
