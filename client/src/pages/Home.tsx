// ELITE PARADISE — homepage.
import { Link } from "wouter";
import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { formatTaka, effectivePrice } from "@shared/catalog";
import { useReveal, usePageMeta } from "../lib/hooks";
import { useSiteImage, useSiteImages } from "../lib/siteImages";
import {
  EmptyState,
  IconChevron,
  ProductGrid,
  ProductGridSkeleton,
  SectionHead,
  Wordmark,
} from "../components/shared";

export default function Home() {
  usePageMeta(
    "Elite Paradise — Elegance in Every Detail | Premium Jewelry & Accessories",
    "Discover exquisite jewelry and timeless accessories at Elite Paradise. Elegant necklaces, earrings, rings, bracelets, couple jewelry and gifts — designed to make every moment extraordinary.",
  );

  const settings = trpc.catalog.settings.useQuery();
  const best = trpc.catalog.bestSellers.useQuery({ limit: 12 });
  const fresh = trpc.catalog.newArrivals.useQuery({ limit: 8 });
  const featured = trpc.catalog.featured.useQuery({ limit: 4 });
  const reviews = trpc.catalog.recentReviews.useQuery({ limit: 8 });

  const s = settings.data;

  return (
    <>
      <Hero settings={s} />
      <CategoryStrip />
      <BestSellers data={best.data} loading={best.isLoading} />
      <EverydayLuxury products={featured.data} loading={featured.isLoading} />
      <NewArrivals data={fresh.data} loading={fresh.isLoading} />
      <CoupleBanner />
      <BrandStory story={s?.brandStory} />
      <GiftSection />
      <WhyUs />
      <Testimonials reviews={reviews.data} loading={reviews.isLoading} />
      <Newsletter />
    </>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ settings }: { settings?: { heroHeadline: string | null; heroSubhead: string | null; heroImage: string | null } }) {
  const headline = settings?.heroHeadline || "Elegance in Every Detail.";
  const banner = useSiteImage("home-banner");
  // The big showcase is our brand banner (public/images/brand-banner.jpg).
  // To change it, replace that file with a new picture of the same name.
  return (
    <section className="bg-ivory">
      <h1 className="sr-only">{headline}</h1>
      <div className="relative">
        <img
          src={banner}
          alt="Elite Paradise — Luxury in Every Detail"
          width={1500}
          height={844}
          fetchPriority="high"
          className="w-full h-auto block md:max-h-[calc(100svh-116px)] md:object-cover animate-[ep-fade_0.8s_ease-out]"
        />
        {/* Buttons sit on the empty silk at the bottom of the banner (tablet and up). */}
        <div className="hidden md:flex absolute inset-x-0 bottom-[5%] justify-center gap-3">
          <Link href="/collections/shop-all" className="ep-btn ep-btn-solid">
            Shop now
          </Link>
          <Link href="/collections/new-arrivals" className="ep-btn ep-btn-ghost bg-white/70 backdrop-blur-sm">
            Explore collections
          </Link>
        </div>
      </div>
      <div className="md:hidden ep-shell py-6 flex flex-col gap-3">
        <Link href="/collections/shop-all" className="ep-btn ep-btn-solid w-full">
          Shop now
        </Link>
        <Link href="/collections/new-arrivals" className="ep-btn ep-btn-ghost w-full">
          Explore collections
        </Link>
      </div>
      <div className="border-y border-border">
        <div className="ep-shell py-4 flex items-center justify-center gap-8 text-[10px] tracking-[0.16em] uppercase text-grey">
          <span>Complimentary delivery over ৳5,000</span>
          <span className="hidden sm:inline">14-day returns</span>
        </div>
      </div>
    </section>
  );
}

// ── Shop by category ─────────────────────────────────────────────────────────

const CATEGORY_CARDS = [
  { label: "Necklaces", href: "/collections/necklaces", key: "cat-necklaces" },
  { label: "Earrings", href: "/collections/earrings", key: "cat-earrings" },
  { label: "Rings", href: "/collections/rings", key: "cat-rings" },
  { label: "Bracelets", href: "/collections/bracelets", key: "cat-bracelets" },
  { label: "Bangles", href: "/collections/bangles", key: "cat-bangles" },
  { label: "Jewelry Sets", href: "/collections/jewelry-sets", key: "cat-sets" },
];

function CategoryStrip() {
  const ref = useReveal<HTMLDivElement>();
  const img = useSiteImages();
  return (
    <section className="ep-section-tight bg-ivory border-t border-border">
      <div className="ep-shell">
        <div ref={ref} className="ep-reveal">
          <SectionHead
            eyebrow="Shop by category"
            title="Find your piece"
            description="Six families, each with its own character."
          />
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
            {CATEGORY_CARDS.map((c) => (
              <Link key={c.href} href={c.href} className="group block">
                <div className="aspect-[3/4] overflow-hidden bg-muted">
                  <img
                    src={img(c.key)}
                    alt={c.label}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-105"
                  />
                </div>
                <div className="pt-3.5 flex items-center justify-between gap-2">
                  <h3 className="font-serif text-[14px] text-ink group-hover:text-gold-deep transition-colors">
                    {c.label}
                  </h3>
                  <span className="text-[9px] tracking-[0.16em] uppercase text-grey group-hover:text-gold-deep transition-colors">
                    Explore
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Best sellers ─────────────────────────────────────────────────────────────

function BestSellers({ data, loading }: { data?: any[]; loading: boolean }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="ep-section bg-white">
      <div className="ep-shell">
        <div ref={ref} className="ep-reveal">
          <SectionHead
            eyebrow="Most loved"
            title="Most Loved Pieces"
            description="Discover the jewelry our customers love most."
            action={{ label: "View all", href: "/collections/best-sellers" }}
            align="left"
          />
          <div className="mt-12">
            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : data?.length ? (
              <ProductGrid products={data} />
            ) : (
              <EmptyState
                title="No best sellers yet"
                body="Mark pieces as best sellers in the admin dashboard and they will appear here."
                action={{ label: "Shop all", href: "/collections/shop-all" }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Everyday luxury (editorial) ──────────────────────────────────────────────

function EverydayLuxury({ products, loading }: { products?: any[]; loading: boolean }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="ep-section bg-ivory">
      <div className="ep-shell">
        <div ref={ref} className="ep-reveal grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-5">
            <p className="ep-eyebrow ep-eyebrow-gold mb-5">Featured collection</p>
            <h2 className="ep-display ep-h2">Everyday Luxury</h2>
            <p className="ep-body-lg mt-5">
              Pieces light enough to forget you are wearing them — a fine chain, a single pearl, a
              slim band. The ones that never come off.
            </p>
            <Link href="/collections/everyday-elegance" className="ep-btn ep-btn-ghost mt-8">
              Shop everyday elegance
            </Link>
          </div>
          <div className="lg:col-span-7">
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="ep-skeleton aspect-[4/5]" />
                <div className="ep-skeleton aspect-[4/5]" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:gap-5">
                {(products ?? []).slice(0, 4).map((p) => (
                  <Link key={p.id} href={`/product/${p.slug}`} className="group block">
                    <div className="aspect-[4/5] overflow-hidden bg-muted">
                      {p.images?.[0] && (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <p className="mt-3 font-serif text-[13.5px] text-ink group-hover:text-gold-deep transition-colors">
                      {p.name}
                    </p>
                    <p className="text-[12px] text-grey mt-0.5">{formatTaka(effectivePrice(p))}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── New arrivals ─────────────────────────────────────────────────────────────

function NewArrivals({ data, loading }: { data?: any[]; loading: boolean }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="ep-section bg-white">
      <div className="ep-shell">
        <div ref={ref} className="ep-reveal">
          <SectionHead
            eyebrow="Just arrived"
            title="New Arrivals"
            description="The latest additions to the house, released in small numbers."
            action={{ label: "View all", href: "/collections/new-arrivals" }}
            align="left"
          />
          <div className="mt-12">
            {loading ? (
              <ProductGridSkeleton count={4} />
            ) : data?.length ? (
              <ProductGrid products={data} />
            ) : (
              <EmptyState
                title="Nothing new just yet"
                body="New pieces are added regularly. Mark products as new arrivals in the admin dashboard."
                action={{ label: "Shop all", href: "/collections/shop-all" }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Couple banner ────────────────────────────────────────────────────────────

function CoupleBanner() {
  const ref = useReveal<HTMLDivElement>();
  const couple = useSiteImage("couple-banner");
  return (
    <section className="relative bg-night text-cream overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={couple}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-night via-night/80 to-night/30" />
      </div>
      <div className="ep-shell relative">
        <div ref={ref} className="ep-reveal py-20 md:py-28 max-w-lg">
          <p className="ep-eyebrow text-gold mb-5">Couple collection</p>
          <h2 className="ep-display ep-h2 text-cream">Two Hearts. One Story.</h2>
          <p className="mt-5 text-[15px] leading-relaxed text-cream/75">
            Celebrate meaningful connections with beautifully matching jewelry.
          </p>
          <Link href="/collections/couple" className="ep-btn ep-btn-ghost-light mt-8">
            Explore couple collection
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Brand story ──────────────────────────────────────────────────────────────

function BrandStory({ story }: { story?: string | null }) {
  const ref = useReveal<HTMLDivElement>();
  const storyImg = useSiteImage("brand-story");
  return (
    <section className="ep-section bg-ivory">
      <div className="ep-shell">
        <div ref={ref} className="ep-reveal grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden bg-muted">
              <img
                src={storyImg}
                alt="Elite Paradise jewelry set on ivory silk"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <p className="ep-eyebrow ep-eyebrow-gold mb-5">Our story</p>
            <h2 className="ep-display ep-h2">More Than Just Jewelry.</h2>
            <p className="ep-body-lg mt-6">
              {story ||
                "At Elite Paradise, we believe jewelry is more than an accessory. It is an expression of individuality, elegance, and the moments that matter most. Every piece is selected to bring timeless beauty into your everyday life."}
            </p>
            <Link href="/about" className="ep-btn ep-btn-ghost mt-8">
              Our story
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Gift section ─────────────────────────────────────────────────────────────

function GiftSection() {
  const ref = useReveal<HTMLDivElement>();
  const img = useSiteImages();
  return (
    <section className="ep-section bg-white">
      <div className="ep-shell">
        <div ref={ref} className="ep-reveal">
          <SectionHead
            eyebrow="Gifting"
            title="Make Every Moment Special."
            description="Gift sets and occasion pieces, presented in our signature ivory box."
          />
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {[
              { label: "Gifts for Her", href: "/collections/gifts-for-her", image: img("gift-her") },
              { label: "Gifts for Him", href: "/collections/gifts-for-him", image: img("gift-him") },
              { label: "Gift Sets", href: "/collections/gift-sets", image: img("gift-sets") },
            ].map((g) => (
              <Link key={g.href} href={g.href} className="group relative block overflow-hidden">
                <div className="aspect-[4/3] bg-muted">
                  <img
                    src={g.image}
                    alt={g.label}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-night/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between">
                  <h3 className="font-serif text-[17px] text-cream">{g.label}</h3>
                  <span className="text-[9px] tracking-[0.16em] uppercase text-cream/80">Shop</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Why choose us ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: "Carefully Curated Designs",
    body: "A small, edited collection — each piece chosen rather than accumulated.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-6 h-6">
        <path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8L12 3z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Elegant Packaging",
    body: "Every order arrives in our ivory presentation box, ready to give.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-6 h-6">
        <path d="M3 8h18v12H3V8z" strokeLinejoin="round" />
        <path d="M3 8l2.5-4h13L21 8M12 4v16" />
      </svg>
    ),
  },
  {
    title: "Secure Shopping",
    body: "Checkout over an encrypted connection, with your details kept private.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-6 h-6">
        <path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Dedicated Customer Support",
    body: "Questions answered directly, by the people who pack your order.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-6 h-6">
        <path d="M4 5h16v11H9l-5 4V5z" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function WhyUs() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="ep-section bg-ivory border-y border-border">
      <div className="ep-shell">
        <div ref={ref} className="ep-reveal">
          <SectionHead eyebrow="Why Elite Paradise" title="Considered, from start to finish" />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {FEATURES.map((f) => (
              <div key={f.title} className="text-center sm:text-left">
                <div className="inline-flex items-center justify-center w-11 h-11 border border-border text-gold-deep mb-5">
                  {f.icon}
                </div>
                <h3 className="font-serif text-[16px] text-ink mb-2">{f.title}</h3>
                <p className="text-[13px] leading-relaxed text-grey">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials({ reviews, loading }: { reviews?: any[]; loading: boolean }) {
  const [i, setI] = useState(0);
  const ref = useReveal<HTMLDivElement>();

  // Real reviews only. With none, we say so rather than inventing praise.
  if (!loading && (!reviews || reviews.length === 0)) {
    return (
      <section className="ep-section bg-white">
        <div className="ep-shell">
          <div ref={ref} className="ep-reveal max-w-2xl mx-auto text-center">
            <p className="ep-eyebrow mb-4">Reviews</p>
            <h2 className="ep-display ep-h2">What our clients say</h2>
            <p className="ep-body mt-5">
              We publish reviews only once a customer has written one — nothing here is written by
              us. If you have bought from us, you can leave a review on any product page.
            </p>
            <Link href="/collections/shop-all" className="ep-btn ep-btn-ghost mt-8">
              Browse the collection
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const list = reviews ?? [];
  const current = list[i % Math.max(list.length, 1)];

  return (
    <section className="ep-section bg-white">
      <div className="ep-shell">
        <div ref={ref} className="ep-reveal max-w-3xl mx-auto text-center">
          <p className="ep-eyebrow mb-4">Reviews</p>
          <h2 className="ep-display ep-h2 mb-10">What our clients say</h2>
          {current && (
            <div>
              <div className="flex justify-center gap-1 mb-6" aria-label={`${current.rating} out of 5`}>
                {Array.from({ length: 5 }).map((_, k) => (
                  <svg
                    key={k}
                    viewBox="0 0 24 24"
                    className={`w-3.5 h-3.5 ${k < current.rating ? "text-gold" : "text-border"}`}
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 2l2.9 6.3 6.9.9-5 4.7 1.2 6.8L12 17.5 6 20.7l1.2-6.8-5-4.7 6.9-.9L12 2z" />
                  </svg>
                ))}
              </div>
              <blockquote className="font-serif text-[clamp(1.15rem,2.4vw,1.6rem)] leading-relaxed text-ink">
                “{current.body}”
              </blockquote>
              <p className="mt-6 text-[11px] tracking-[0.18em] uppercase text-grey">{current.name}</p>
              {list.length > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setI((i - 1 + list.length) % list.length)}
                    aria-label="Previous review"
                    className="p-2 text-grey hover:text-ink transition-colors"
                  >
                    <IconChevron dir="left" />
                  </button>
                  <span className="text-[11px] text-grey tabular-nums">
                    {(i % list.length) + 1} / {list.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setI((i + 1) % list.length)}
                    aria-label="Next review"
                    className="p-2 text-grey hover:text-ink transition-colors"
                  >
                    <IconChevron dir="right" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Newsletter ───────────────────────────────────────────────────────────────

function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sub = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setDone(true);
      setEmail("");
    },
    onError: (e) => setError(e.message),
  });

  return (
    <section className="ep-section bg-ivory border-t border-border">
      <div className="ep-shell-narrow text-center">
        <Wordmark size="lg" tagline={false} className="mb-8" />
        <h2 className="ep-display ep-h2">Join the Elite Circle.</h2>
        <p className="ep-body mt-4 max-w-md mx-auto">
          Get exclusive updates on new arrivals, special collections, and offers.
        </p>

        {done ? (
          <p className="mt-8 text-[13px] text-gold-deep">
            You are on the list. Thank you for joining.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              sub.mutate({ email });
            }}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="ep-field flex-1 text-center sm:text-left"
            />
            <button type="submit" disabled={sub.isPending} className="ep-btn ep-btn-solid shrink-0">
              {sub.isPending ? "Joining…" : "Subscribe"}
            </button>
          </form>
        )}
        {error && <p className="mt-3 text-[12px] text-destructive">{error}</p>}
        <p className="mt-4 text-[11px] text-grey">
          We store your address to send occasional updates. Unsubscribe any time by replying.
        </p>
      </div>
    </section>
  );
}
