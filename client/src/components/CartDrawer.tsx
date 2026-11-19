// Sliding cart drawer. Prices here are display-only; the server re-prices at
// checkout and its numbers are authoritative.
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/_core/trpc";
import { formatTaka } from "@shared/catalog";
import { useCart, setQty, removeLine } from "../lib/cart";
import { useBodyLock, useEscape } from "../lib/hooks";
import { gsap, motionOk } from "../lib/anim";
import { IconClose, QtyStepper } from "./shared";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, count, subtotal } = useCart();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  useBodyLock(open);
  useEscape(onClose, open);

  // Slide the sheet in from the right on open. Reverting on close is handled by
  // the unmount below, so no leftover transform can stick to the element.
  useEffect(() => {
    if (!open || !panelRef.current || !motionOk()) return;
    const tween = gsap.fromTo(
      panelRef.current,
      { xPercent: 100 },
      { xPercent: 0, duration: 0.52, ease: "power3.out" },
    );
    return () => {
      tween.kill();
    };
  }, [open]);

  const quote = trpc.checkout.quote.useQuery(
    {
      lines: lines.map((l) => ({ productId: l.productId, qty: l.qty, variant: l.variant })),
      discountCode: applied,
    },
    { enabled: open && lines.length > 0 },
  );

  if (!open) return null;

  const q = quote.data;
  const delivery = q?.deliveryCharge ?? 0;
  const discount = q?.discount ?? 0;
  const total = q?.total ?? subtotal;
  const freeAt = q?.freeDeliveryThreshold ?? 0;
  const remaining = freeAt > 0 ? Math.max(0, freeAt - (subtotal - discount)) : 0;

  return (
    <>
      <div className="ep-scrim-glass" onClick={onClose} />
      <aside
        ref={panelRef}
        className="ep-glass-drawer fixed inset-y-0 right-0 z-[70] w-full sm:w-[440px] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
      >
        <div className="flex items-center justify-between px-6 h-[68px] border-b border-border shrink-0">
          <h2 className="text-[11px] font-medium tracking-[0.22em] uppercase text-ink">
            Your bag {count > 0 && <span className="text-grey">({count})</span>}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close bag" className="p-2 -mr-2 text-ink">
            <IconClose />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <p className="ep-display ep-h3 mb-3">Your bag is empty</p>
            <p className="ep-body mb-8">
              Nothing chosen yet. The collection is a good place to start.
            </p>
            <Link href="/collections/shop-all" onClick={onClose} className="ep-btn ep-btn-solid">
              Explore the collection
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {freeAt > 0 && (
                <div className="py-4 border-b border-border">
                  <p className="text-[11px] text-grey">
                    {remaining > 0 ? (
                      <>
                        Add <span className="text-ink">{formatTaka(remaining)}</span> more for complimentary delivery.
                      </>
                    ) : (
                      <span className="text-gold-deep">Complimentary delivery applied.</span>
                    )}
                  </p>
                  <div className="mt-2 h-[2px] bg-border overflow-hidden">
                    <div
                      className="h-full bg-gold transition-all duration-500"
                      style={{ width: `${Math.min(100, ((subtotal - discount) / freeAt) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <ul className="divide-y divide-border">
                {lines.map((l) => (
                  <li key={`${l.productId}::${l.variant ?? ""}`} className="py-5 flex gap-4">
                    <Link
                      href={`/product/${l.slug}`}
                      onClick={onClose}
                      className="w-[76px] h-[95px] shrink-0 bg-muted overflow-hidden"
                    >
                      {l.image && (
                        <img src={l.image} alt={l.name} className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/product/${l.slug}`}
                          onClick={onClose}
                          className="font-serif text-[14px] leading-snug text-ink hover:text-gold-deep transition-colors"
                        >
                          {l.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeLine(l.productId, l.variant)}
                          aria-label={`Remove ${l.name}`}
                          className="text-grey hover:text-ink shrink-0 p-0.5"
                        >
                          <IconClose className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {l.variant && <p className="text-[11px] text-grey mt-0.5">{l.variant}</p>}
                      <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                        <QtyStepper
                          value={l.qty}
                          onChange={(n) => setQty(l.productId, l.variant, n)}
                          label={`Quantity for ${l.name}`}
                        />
                        <span className="text-[13px] text-ink tabular-nums">
                          {formatTaka(l.unit * l.qty)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Discount code */}
              <div className="py-5 border-t border-border">
                <label htmlFor="cart-code" className="ep-label">
                  Discount code
                </label>
                <div className="flex gap-2">
                  <input
                    id="cart-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="ep-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setApplied(code.trim() || null)}
                    className="ep-btn ep-btn-ghost ep-btn-sm shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {q?.discountError && (
                  <p className="text-[11px] text-destructive mt-2">{q.discountError}</p>
                )}
                {q?.appliedCode && (
                  <p className="text-[11px] text-gold-deep mt-2">
                    {q.appliedCode} applied — {formatTaka(discount)} off.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-border px-6 py-5 shrink-0 bg-ivory/70 backdrop-blur-xl">
              <dl className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-grey">Subtotal</dt>
                  <dd className="text-ink tabular-nums">{formatTaka(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-grey">Discount</dt>
                    <dd className="text-gold-deep tabular-nums">−{formatTaka(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-grey">Delivery</dt>
                  <dd className="text-ink tabular-nums">
                    {delivery === 0 ? "Complimentary" : formatTaka(delivery)}
                  </dd>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <dt className="text-[11px] tracking-[0.18em] uppercase text-ink">Total</dt>
                  <dd className="text-[15px] text-ink tabular-nums">{formatTaka(total)}</dd>
                </div>
              </dl>
              <Link
                href={applied ? `/checkout?code=${encodeURIComponent(applied)}` : "/checkout"}
                onClick={onClose}
                className="ep-btn ep-btn-solid w-full mt-5"
              >
                Proceed to checkout
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-center text-[10px] tracking-[0.18em] uppercase text-grey hover:text-ink mt-3 py-1"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
