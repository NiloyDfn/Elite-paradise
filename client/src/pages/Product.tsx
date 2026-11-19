// Product detail: gallery with zoom + full-screen, variants, purchase, tabs.
import { Link, useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/_core/trpc";
import {
  categoryLabel,
  discountPercent,
  effectivePrice,
  formatTaka,
} from "@shared/catalog";
import { useBodyLock, useEscape, usePageMeta, useJsonLd } from "../lib/hooks";
import { addToCart, pushRecent, useRecent, useWishlist, toggleLocalWish } from "../lib/cart";
import {
  Accordion,
  EmptyState,
  IconChevron,
  IconClose,
  IconHeart,
  IconWhatsApp,
  Price,
  ProductGrid,
  QtyStepper,
  SampleNotice,
} from "../components/shared";
import { useAuth } from "@/_core/useAuth";

export default function ProductPage({ slug }: { slug: string }) {
  const { data, isLoading, isError, error } = trpc.catalog.product.useQuery({ slug });
  const settings = trpc.catalog.settings.useQuery();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const p = data?.product;
  const wish = useWishlist();
  const recentIds = useRecent();

  usePageMeta(
    p ? `${p.name} — Elite Paradise` : "Product — Elite Paradise",
    p?.description?.slice(0, 155) ?? undefined,
  );

  // Product structured data — price, availability and images in the form a
  // search engine reads. Built from the same values the page renders, so it can
  // never advertise a price the storefront does not show.
  useJsonLd(
    p
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.description ?? undefined,
          sku: p.sku,
          image: p.images?.length ? p.images : undefined,
          brand: { "@type": "Brand", name: "Elite Paradise" },
          material: p.material ?? undefined,
          color: p.color ?? undefined,
          offers: {
            "@type": "Offer",
            priceCurrency: "BDT",
            price: p.salePrice ?? p.price,
            availability:
              p.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            url: `https://eliteparadise.com.bd/product/${p.slug}`,
          },
        }
      : null,
  );

  // Reset per-product state on navigation.
  useEffect(() => {
    setActive(0);
    setQty(1);
    setVariant(null);
    setAdded(false);
  }, [slug]);

  useEffect(() => {
    if (p) pushRecent(p.id);
  }, [p?.id]);

  const recentQuery = trpc.catalog.productsByIds.useQuery(
    { ids: recentIds.filter((id) => id !== p?.id).slice(0, 4) },
    { enabled: recentIds.length > 0 },
  );

  // NOTE: every hook must run before the early returns below, or React sees a
  // different hook count between the loading and loaded renders.
  const waMessage = useMemo(() => {
    if (!p) return "";
    const url = `${window.location.origin}/product/${p.slug}`;
    const lines = [
      `Hello Elite Paradise, I would like to order:`,
      ``,
      `• ${p.name}`,
      `• Price: ${formatTaka(effectivePrice(p))}`,
      variant ? `• Variant: ${variant}` : null,
      `• Quantity: ${qty}`,
      `• Link: ${url}`,
    ].filter(Boolean);
    return lines.join("\n");
  }, [p, variant, qty]);

  if (isLoading) return <ProductSkeleton />;

  if (isError || !p) {
    return (
      <div className="ep-shell ep-section">
        <EmptyState
          title="We could not find that piece"
          body={error?.message || "It may have been removed, or the link may be wrong."}
          action={{ label: "Shop all", href: "/collections/shop-all" }}
        />
      </div>
    );
  }

  const images = p.images?.length ? p.images : [];
  const off = discountPercent(p);
  const price = effectivePrice(p);
  const soldOut = p.stock <= 0;
  const isWished = wish.includes(p.id);
  const wa = (settings.data?.whatsappNumber ?? "").replace(/[^0-9]/g, "");

  const handleAdd = () => {
    addToCart(
      {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        image: images[0] ?? null,
        unit: price,
        variant,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const handleBuyNow = () => {
    handleAdd();
    navigate("/checkout");
  };

  return (
    <>
      <div className="ep-shell pt-6 pb-2">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-[10px] tracking-[0.14em] uppercase text-grey flex-wrap">
            <li>
              <Link href="/" className="hover:text-ink transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/collections/${p.category}`} className="hover:text-ink transition-colors">
                {categoryLabel(p.category)}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink/70 truncate max-w-[45vw] sm:max-w-[320px]">{p.name}</li>
          </ol>
        </nav>
      </div>

      <section className="ep-shell pb-16 md:pb-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 pt-6">
          {/* Gallery */}
          <div>
            <div className="relative aspect-[4/5] bg-muted overflow-hidden group">
              {images[active] ? (
                <button
                  type="button"
                  onClick={() => setZoomOpen(true)}
                  className="w-full h-full cursor-zoom-in"
                  aria-label="Open full-screen image"
                >
                  <img
                    src={images[active]}
                    alt={`${p.name} — view ${active + 1}`}
                    width={1000}
                    height={1250}
                    fetchPriority="high"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </button>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] tracking-[0.2em] uppercase text-grey">
                  No image
                </div>
              )}
              {off > 0 && (
                <span className="absolute top-4 left-4 ep-badge">−{off}%</span>
              )}
              {soldOut && (
                <span className="absolute top-4 right-4 ep-badge ep-badge-outline">Sold out</span>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2.5 overflow-x-auto ep-no-scrollbar">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`View image ${i + 1}`}
                    aria-current={i === active}
                    className={`w-[68px] h-[85px] shrink-0 overflow-hidden bg-muted border transition-colors ${
                      i === active ? "border-ink" : "border-transparent hover:border-border"
                    }`}
                  >
                    <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:pt-2">
            <p className="ep-eyebrow mb-3">{categoryLabel(p.category)}</p>
            <h1 className="ep-display ep-h2">{p.name}</h1>

            <div className="mt-4">
              <Price price={p.price} salePrice={p.salePrice} size="lg" />
            </div>

            <p className="ep-body mt-6">{p.description}</p>

            <div className="mt-6 flex items-center gap-2 text-[11px] tracking-[0.12em] uppercase">
              {soldOut ? (
                <span className="text-destructive">Out of stock</span>
              ) : p.stock <= 5 ? (
                <span className="text-gold-deep">Only {p.stock} left</span>
              ) : (
                <span className="text-grey">In stock</span>
              )}
            </div>

            {/* Variants */}
            {p.sizes && p.sizes.length > 0 && (
              <div className="mt-7">
                <p className="ep-label">
                  {p.category === "rings" ? "Size" : p.category === "necklaces" || p.category === "chains" ? "Length" : "Size"}
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {p.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setVariant(variant === s ? null : s)}
                      aria-pressed={variant === s}
                      className={`px-4 py-2.5 text-[11.5px] border transition-colors ${
                        variant === s
                          ? "border-gold bg-gold text-night"
                          : "border-input text-ink hover:border-ink"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + actions */}
            <div className="mt-7 flex items-center gap-4">
              <div>
                <p className="ep-label">Quantity</p>
                <QtyStepper value={qty} onChange={setQty} max={Math.max(1, Math.min(p.stock, 99))} />
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={handleAdd}
                disabled={soldOut}
                className="ep-btn ep-btn-solid w-full"
              >
                {soldOut ? "Sold out" : added ? "Added to bag" : "Add to bag"}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={soldOut}
                className="ep-btn ep-btn-ghost w-full"
              >
                Buy now
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => toggleLocalWish(p.id)}
                  aria-pressed={isWished}
                  className="ep-btn ep-btn-ghost ep-btn-sm"
                >
                  <IconHeart filled={isWished} className="w-4 h-4" />
                  {isWished ? "Saved" : "Wishlist"}
                </button>
                {wa ? (
                  <a
                    href={`https://wa.me/${wa}?text=${encodeURIComponent(waMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ep-btn ep-btn-ghost ep-btn-sm"
                  >
                    <IconWhatsApp className="w-4 h-4" />
                    WhatsApp
                  </a>
                ) : (
                  <span className="ep-btn ep-btn-ghost ep-btn-sm opacity-40 cursor-not-allowed">
                    <IconWhatsApp className="w-4 h-4" />
                    WhatsApp
                  </span>
                )}
              </div>
            </div>

            {/* Specs */}
            <dl className="mt-8 pt-6 border-t border-border grid grid-cols-2 gap-y-3 gap-x-6 text-[12.5px]">
              <Spec label="SKU" value={p.sku} />
              {p.material && <Spec label="Material" value={p.material} />}
              {p.color && <Spec label="Colour" value={p.color} />}
              {p.weight && <Spec label="Weight" value={p.weight} />}
              <Spec label="Availability" value={soldOut ? "Out of stock" : `${p.stock} in stock`} />
            </dl>

            {p.isSample && <SampleNotice className="mt-6" />}

            {/* Accordions */}
            <div className="mt-8">
              <Accordion
                items={[
                  {
                    title: "Product details",
                    body: (
                      <div className="space-y-2">
                        <p>{p.description}</p>
                        <p className="text-grey">
                          Category: {categoryLabel(p.category)} · Collection: {p.gender === "men" ? "Men" : p.gender === "unisex" ? "Couple / Unisex" : "Women"}
                        </p>
                      </div>
                    ),
                  },
                  {
                    title: "Materials & specifications",
                    body: (
                      <ul className="space-y-1.5">
                        {p.material && <li>Material: {p.material}</li>}
                        {p.color && <li>Colour: {p.color}</li>}
                        {p.weight && <li>Weight: {p.weight}</li>}
                        {p.sizes?.length ? <li>Available sizes: {p.sizes.join(", ")}</li> : null}
                        <li>SKU: {p.sku}</li>
                      </ul>
                    ),
                  },
                  {
                    title: "Jewelry care",
                    body: (
                      <div className="space-y-2">
                        <p>{p.careInstructions || "Store in the pouch provided, away from moisture and direct sunlight. Wipe with a soft cloth after wear."}</p>
                        <Link href="/care-guide" className="ep-link text-[10px]">
                          Full care guide
                        </Link>
                      </div>
                    ),
                  },
                  {
                    title: "Shipping",
                    body: (
                      <div className="space-y-2">
                        <p>
                          Delivered across Bangladesh. Orders over ৳
                          {(settings.data?.freeDeliveryThreshold ?? 5000).toLocaleString("en-US")} ship
                          free; otherwise ৳{settings.data?.deliveryCharge ?? 120}.
                        </p>
                        <p>Inside Dhaka usually 1–2 working days; elsewhere 2–4.</p>
                        <Link href="/shipping" className="ep-link text-[10px]">
                          Shipping information
                        </Link>
                      </div>
                    ),
                  },
                  {
                    title: "Returns",
                    body: (
                      <div className="space-y-2">
                        <p>
                          Unworn pieces in their original packaging can be returned within 14 days of
                          delivery. Earrings are excluded for hygiene reasons.
                        </p>
                        <Link href="/returns" className="ep-link text-[10px]">
                          Returns & refunds
                        </Link>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <ReviewsSection productId={p.id} reviews={data.reviews} signedIn={!!user} />

      {/* Related */}
      {data.related.length > 0 && (
        <section className="ep-section bg-white border-t border-border">
          <div className="ep-shell">
            <h2 className="ep-display ep-h3 mb-10">You may also like</h2>
            <ProductGrid products={data.related} />
          </div>
        </section>
      )}

      {/* Recently viewed */}
      {recentQuery.data && recentQuery.data.length > 0 && (
        <section className="ep-section-tight bg-ivory border-t border-border">
          <div className="ep-shell">
            <h2 className="ep-display ep-h3 mb-10">Recently viewed</h2>
            <ProductGrid products={recentQuery.data} />
          </div>
        </section>
      )}

      {/* Full-screen viewer */}
      {zoomOpen && images.length > 0 && (
        <Lightbox
          images={images}
          index={active}
          onIndex={setActive}
          onClose={() => setZoomOpen(false)}
          alt={p.name}
        />
      )}
    </>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] tracking-[0.16em] uppercase text-grey mb-0.5">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function ReviewsSection({
  productId,
  reviews,
  signedIn,
}: {
  productId: string;
  reviews: { id: string; name: string; rating: number; body: string; createdAt: Date | string }[];
  signedIn: boolean;
}) {
  const utils = trpc.useUtils();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [open, setOpen] = useState(false);
  const add = trpc.account.addReview.useMutation({
    onSuccess: () => {
      setBody("");
      setOpen(false);
      utils.catalog.product.invalidate();
    },
  });

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section className="ep-section-tight bg-ivory border-t border-border">
      <div className="ep-shell">
        <div className="max-w-2xl">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="ep-display ep-h3">Customer reviews</h2>
            {avg && (
              <p className="text-[12px] text-grey">
                {avg} out of 5 · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </p>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="ep-body mt-4">
              No reviews yet. Reviews appear here once a customer writes one — we do not write them
              ourselves.
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-border">
              {reviews.map((r) => (
                <li key={r.id} className="py-5">
                  <div className="flex items-center gap-2 mb-2">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <svg
                        key={k}
                        viewBox="0 0 24 24"
                        className={`w-3 h-3 ${k < r.rating ? "text-gold" : "text-border"}`}
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 2l2.9 6.3 6.9.9-5 4.7 1.2 6.8L12 17.5 6 20.7l1.2-6.8-5-4.7 6.9-.9L12 2z" />
                      </svg>
                    ))}
                    <span className="text-[11px] text-grey ml-1">{r.name}</span>
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-ink/85">{r.body}</p>
                </li>
              ))}
            </ul>
          )}

          {signedIn ? (
            open ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  add.mutate({ productId, rating, body });
                }}
                className="mt-6 border border-border p-5"
              >
                <p className="ep-label">Your rating</p>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      className="p-0.5"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className={`w-5 h-5 ${n <= rating ? "text-gold" : "text-border"}`}
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 2l2.9 6.3 6.9.9-5 4.7 1.2 6.8L12 17.5 6 20.7l1.2-6.8-5-4.7 6.9-.9L12 2z" />
                      </svg>
                    </button>
                  ))}
                </div>
                <label htmlFor="review-body" className="ep-label">
                  Your review
                </label>
                <textarea
                  id="review-body"
                  required
                  minLength={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="ep-field resize-none"
                  placeholder="How does it wear? How does it look?"
                />
                {add.error && (
                  <p className="text-[12px] text-destructive mt-2">{add.error.message}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <button type="submit" disabled={add.isPending} className="ep-btn ep-btn-solid ep-btn-sm">
                    {add.isPending ? "Posting…" : "Post review"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="ep-btn ep-btn-ghost ep-btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="ep-btn ep-btn-ghost ep-btn-sm mt-6"
              >
                Write a review
              </button>
            )
          ) : (
            <p className="mt-6 text-[12.5px] text-grey">
              <Link href="/login" className="underline hover:text-ink">
                Sign in
              </Link>{" "}
              to write a review.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Lightbox({
  images,
  index,
  onIndex,
  onClose,
  alt,
}: {
  images: string[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  alt: string;
}) {
  useBodyLock(true);
  useEscape(onClose, true);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [index, images.length, onIndex]);

  return (
    <div className="fixed inset-0 z-[90] bg-night/97 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Image viewer">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close viewer"
        className="absolute top-5 right-5 z-10 p-3 text-cream/80 hover:text-cream"
      >
        <IconClose className="w-6 h-6" />
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => onIndex((index - 1 + images.length) % images.length)}
            aria-label="Previous image"
            className="absolute left-3 md:left-8 z-10 p-3 text-cream/70 hover:text-cream"
          >
            <IconChevron dir="left" className="w-7 h-7" />
          </button>
          <button
            type="button"
            onClick={() => onIndex((index + 1) % images.length)}
            aria-label="Next image"
            className="absolute right-3 md:right-8 z-10 p-3 text-cream/70 hover:text-cream"
          >
            <IconChevron dir="right" className="w-7 h-7" />
          </button>
        </>
      )}
      <img
        src={images[index]}
        alt={`${alt} — view ${index + 1}`}
        className="max-h-[88vh] max-w-[92vw] object-contain"
      />
      <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.18em] text-cream/50 tabular-nums">
        {index + 1} / {images.length}
      </p>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="ep-shell py-10">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="ep-skeleton aspect-[4/5]" />
        <div className="space-y-4 pt-4">
          <div className="ep-skeleton h-3 w-24" />
          <div className="ep-skeleton h-9 w-3/4" />
          <div className="ep-skeleton h-5 w-32" />
          <div className="ep-skeleton h-20 w-full" />
          <div className="ep-skeleton h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
