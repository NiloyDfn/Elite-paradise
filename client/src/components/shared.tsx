// ─────────────────────────────────────────────────────────────────────────────
// Shared storefront components.
// ─────────────────────────────────────────────────────────────────────────────
import { useSiteImage } from "../lib/siteImages";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { formatTaka, discountPercent, effectivePrice } from "@shared/catalog";
import { useReveal } from "../lib/hooks";
import { useWishlist, toggleLocalWish } from "../lib/cart";

export type ProductLike = {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  images: string[] | null;
  stock: number;
  isSample?: boolean;
};

// ── Icons: thin 1px line work, as in the references ──────────────────────────

export function IconSearch({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L21 21" strokeLinecap="round" />
    </svg>
  );
}

export function IconUser({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" strokeLinecap="round" />
    </svg>
  );
}

export function IconHeart({ className = "w-[18px] h-[18px]", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 8a4.4 4.4 0 0 1 7.5 2.9c0 5-7.5 9.6-7.5 9.6z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconBag({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
      <path d="M5 7h14l-1 13H6L5 7z" strokeLinejoin="round" />
      <path d="M9 7V5.5a3 3 0 0 1 6 0V7" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function IconChevron({ className = "w-4 h-4", dir = "down" }: { className?: string; dir?: "down" | "left" | "right" | "up" }) {
  const rot = { down: 0, left: 90, right: -90, up: 180 }[dir];
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ transform: `rotate(${rot}deg)` }} aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconWhatsApp({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.94L2 22l5.36-1.4a9.8 9.8 0 0 0 4.68 1.2h.01c5.43 0 9.84-4.4 9.84-9.84C21.89 6.4 17.48 2 12.04 2zm5.76 14.02c-.24.68-1.4 1.3-1.94 1.34-.5.05-.98.23-3.3-.7-2.78-1.1-4.54-3.94-4.68-4.12-.14-.18-1.12-1.5-1.12-2.86 0-1.36.72-2.02.98-2.3.24-.26.54-.32.72-.32.18 0 .36 0 .52.01.16.01.4-.06.62.48.24.58.8 1.98.86 2.12.06.14.1.3.02.48-.08.18-.14.3-.28.46-.14.16-.3.36-.42.48-.14.14-.28.3-.12.58.16.28.72 1.18 1.54 1.92 1.06.94 1.94 1.24 2.22 1.38.28.14.44.12.6-.08.16-.2.7-.82.88-1.1.18-.28.36-.24.6-.14.24.1 1.54.72 1.8.86.26.14.44.2.5.32.06.12.06.7-.18 1.38z" />
    </svg>
  );
}

// ── Wordmark lockup ──────────────────────────────────────────────────────────

export function Wordmark({
  size = "md",
  className = "",
  onDark = false,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  tagline?: boolean; // kept for old callers — the logo already contains the name
  className?: string;
  onDark?: boolean;
}) {
  // Our real logo (public/images/logo.png). Replace that file to change it everywhere.
  const h = {
    sm: "h-10",
    md: "h-12 md:h-[68px]",
    lg: "h-28",
    xl: "h-40",
  }[size];
  const logo = useSiteImage("logo");
  const img = <img src={logo} alt="Elite Paradise" className={`${h} w-auto block`} />;
  return (
    <span className={`inline-flex ${className}`}>
      {onDark ? <span className="bg-cream rounded-md p-2.5 inline-flex">{img}</span> : img}
    </span>
  );
}

// ── Section heading ──────────────────────────────────────────────────────────

export function SectionHead({
  eyebrow,
  title,
  description,
  align = "center",
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  action?: { label: string; href: string };
}) {
  const ref = useReveal<HTMLDivElement>();
  const centered = align === "center";
  return (
    <div
      ref={ref}
      className={`ep-reveal ${centered ? "text-center mx-auto max-w-2xl" : "flex flex-wrap items-end justify-between gap-6"}`}
    >
      <div className={centered ? "" : "max-w-xl"}>
        {eyebrow && <p className="ep-eyebrow mb-4">{eyebrow}</p>}
        <h2 className="ep-display ep-h2">{title}</h2>
        {description && (
          <p className={`ep-body mt-4 ${centered ? "mx-auto max-w-xl" : ""}`}>{description}</p>
        )}
      </div>
      {action && (
        <Link href={action.href} className="ep-link shrink-0">
          {action.label}
        </Link>
      )}
    </div>
  );
}

// ── Product card ─────────────────────────────────────────────────────────────

export function ProductCard({ product, priority = false }: { product: ProductLike; priority?: boolean }) {
  const wish = useWishlist();
  const isWished = wish.includes(product.id);
  const off = discountPercent(product);
  const price = effectivePrice(product);
  const soldOut = product.stock <= 0;
  const img = product.images?.[0] ?? null;

  return (
    <article className="ep-card group relative">
      <div className="ep-card-media">
        <Link href={`/product/${product.slug}`} aria-label={product.name}>
          {img ? (
            <img
              src={img}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              width={800}
              height={1000}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] tracking-[0.2em] uppercase text-grey">
              No image
            </div>
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {off > 0 && <span className="ep-badge">−{off}%</span>}
          {soldOut && <span className="ep-badge ep-badge-outline">Sold out</span>}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={() => toggleLocalWish(product.id)}
          aria-label={isWished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={isWished}
          className="absolute top-2.5 right-2.5 w-9 h-9 flex items-center justify-center bg-white/85 backdrop-blur-sm text-ink transition-colors hover:bg-white"
        >
          <IconHeart filled={isWished} className={`w-[17px] h-[17px] ${isWished ? "text-gold-deep" : ""}`} />
        </button>

        {/* Quick add — slides up on hover, always reachable on touch */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 focus-within:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] max-md:translate-y-0">
          <Link
            href={`/product/${product.slug}`}
            className="block w-full bg-night/90 backdrop-blur-sm text-cream text-center py-3.5 text-[10px] font-medium tracking-[0.2em] uppercase hover:bg-ink transition-colors"
          >
            {soldOut ? "View piece" : "Quick add"}
          </Link>
        </div>
      </div>

      <div className="pt-4 pb-1">
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="font-serif text-[15px] leading-snug text-ink group-hover:text-gold-deep transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[13px] text-ink">{formatTaka(price)}</span>
          {off > 0 && (
            <span className="text-[12px] text-grey line-through">{formatTaka(product.price)}</span>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Product grid ─────────────────────────────────────────────────────────────

export function ProductGrid({ products, cols = 4 }: { products: ProductLike[]; cols?: 3 | 4 }) {
  const cls =
    cols === 3
      ? "grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10 md:gap-x-7 md:gap-y-14"
      : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10 md:gap-x-7 md:gap-y-14";
  return (
    <div className={cls}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="text-center py-20 px-6 border border-dashed border-border">
      <div className="mx-auto w-12 h-12 mb-6 flex items-center justify-center border border-border rounded-full">
        <IconBag className="w-5 h-5 text-grey" />
      </div>
      <h3 className="ep-display ep-h3 mb-3">{title}</h3>
      <p className="ep-body max-w-md mx-auto">{body}</p>
      {action && (
        <Link href={action.href} className="ep-btn ep-btn-solid mt-8">
          {action.label}
        </Link>
      )}
    </div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10 md:gap-x-7 md:gap-y-14">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="ep-skeleton aspect-[4/5] w-full" />
          <div className="ep-skeleton h-3 w-3/4 mt-4" />
          <div className="ep-skeleton h-3 w-1/3 mt-2" />
        </div>
      ))}
    </div>
  );
}

// ── Sample-content notice ────────────────────────────────────────────────────

export function SampleNotice({ className = "" }: { className?: string }) {
  // Deliberately terse. This sits under every product card and on the product
  // page, so a full sentence here reads as developer scaffolding on a live
  // storefront. The detail lives in the admin Products tab instead.
  return (
    <p className={`text-[10px] leading-relaxed text-grey ${className}`}>
      <span className="inline-block border border-border px-1.5 py-0.5 mr-1.5 text-[8.5px] tracking-[0.14em] uppercase">
        Sample
      </span>
      Placeholder piece
    </p>
  );
}

// ── Price ────────────────────────────────────────────────────────────────────

export function Price({
  price,
  salePrice,
  size = "md",
}: {
  price: number;
  salePrice: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const off = discountPercent({ price, salePrice });
  const eff = effectivePrice({ price, salePrice });
  const cls = { sm: "text-[13px]", md: "text-[15px]", lg: "text-[22px]" }[size];
  return (
    <div className="flex items-baseline gap-2.5 flex-wrap">
      <span className={`${cls} text-ink`}>{formatTaka(eff)}</span>
      {off > 0 && (
        <>
          <span className={`${cls} text-grey line-through`}>{formatTaka(price)}</span>
          <span className="ep-badge">−{off}%</span>
        </>
      )}
    </div>
  );
}

// ── Quantity stepper ─────────────────────────────────────────────────────────

export function QtyStepper({
  value,
  onChange,
  max = 99,
  label = "Quantity",
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  label?: string;
}) {
  return (
    <div className="inline-flex items-center border border-input" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="Decrease quantity"
        className="w-10 h-11 flex items-center justify-center text-ink disabled:opacity-30 hover:bg-muted transition-colors"
      >
        −
      </button>
      <span className="w-10 text-center text-[13px] tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="w-10 h-11 flex items-center justify-center text-ink disabled:opacity-30 hover:bg-muted transition-colors"
      >
        +
      </button>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [message, onDone]);
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-gold text-night px-6 py-3.5 text-[11px] tracking-[0.16em] uppercase shadow-xl"
    >
      {message}
    </div>
  );
}

// ── Accordion ────────────────────────────────────────────────────────────────

export function Accordion({
  items,
  defaultOpen = 0,
}: {
  items: { title: string; body: React.ReactNode }[];
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  return (
    <div className="border-t border-border">
      {items.map((it, i) => (
        <div key={it.title} className="border-b border-border">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="w-full flex items-center justify-between gap-4 py-5 text-left"
          >
            <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-ink">
              {it.title}
            </span>
            <span className={`transition-transform duration-300 ${open === i ? "rotate-180" : ""}`}>
              <IconChevron className="w-4 h-4 text-grey" />
            </span>
          </button>
          <div
            className="grid transition-all duration-400 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
            style={{ gridTemplateRows: open === i ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div className="pb-6 ep-body text-[14px]">{it.body}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
