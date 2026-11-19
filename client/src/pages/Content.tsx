// Static content pages: About, Contact, FAQ, Care, Shipping, Returns, Privacy, Terms.
import { Link } from "wouter";
import { trpc } from "@/_core/trpc";
import { EDITORIAL } from "@shared/catalog";
import { usePageMeta } from "../lib/hooks";
import { Accordion, IconWhatsApp, Wordmark } from "../components/shared";

// ── Shared page shell ────────────────────────────────────────────────────────

function PageHero({
  eyebrow,
  title,
  intro,
  image,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  image?: string;
}) {
  return (
    <section className="ep-page-hero">
      {image && <img src={image} alt="" className="ep-page-hero-img" />}
      <div className="ep-shell relative">
        <div className="py-16 md:py-24 max-w-2xl mx-auto text-center">
          <p className="ep-eyebrow text-gold-deep mb-5">{eyebrow}</p>
          <h1 className="ep-display ep-h1 text-ink">{title}</h1>
          <span className="ep-orn mx-auto mt-6" aria-hidden="true" />
          {intro && <p className="mt-6 text-[15px] leading-relaxed text-ink/65">{intro}</p>}
        </div>
      </div>
    </section>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="ep-shell-narrow py-14 md:py-20">
      <div className="space-y-8 text-[14.5px] leading-[1.85] text-ink/80">{children}</div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="ep-display text-[clamp(1.25rem,2.4vw,1.6rem)] text-ink pt-2">{children}</h2>;
}

// ── About ────────────────────────────────────────────────────────────────────

export function About() {
  usePageMeta("About Us — Elite Paradise", "The story behind Elite Paradise — considered jewelry from Dhaka.");
  const settings = trpc.catalog.settings.useQuery();

  return (
    <>
      <PageHero
        eyebrow="Our story"
        title="More Than Just Jewelry."
        intro="Elite Paradise began with a simple idea: that a piece of jewelry should be chosen once and worn for years."
        image={EDITORIAL.set}
      />

      <Prose>
        <p className="ep-body-lg text-ink">
          {settings.data?.brandStory ||
            "At Elite Paradise, we believe jewelry is more than an accessory. It is an expression of individuality, elegance, and the moments that matter most. Every piece is selected to bring timeless beauty into your everyday life."}
        </p>

        <H2>How we choose</H2>
        <p>
          We keep the collection deliberately small. Each piece is chosen for how it wears on the
          third year, not the first afternoon — the weight of a chain, whether a clasp sits flat,
          whether a setting catches on knitwear. Anything that fails those tests does not go on the
          site.
        </p>

        <H2>Materials</H2>
        <p>
          Our gold pieces are 18k gold vermeil over sterling silver, or gold-plated stainless steel
          where a piece needs to take more wear. Pearls are freshwater. Every product page lists the
          exact material, the weight, and how to care for it — because a piece you cannot look after
          is not a piece you can keep.
        </p>

        <H2>Where we are</H2>
        <p>
          We are based in Dhaka and deliver across Bangladesh. Orders are packed by hand, in the
          same building where we answer the phone.
        </p>

        <div className="pt-4">
          <Link href="/collections/shop-all" className="ep-btn ep-btn-solid">
            Explore the collection
          </Link>
        </div>
      </Prose>
    </>
  );
}

// ── Contact ──────────────────────────────────────────────────────────────────

export function Contact() {
  usePageMeta("Contact Us — Elite Paradise", "Get in touch with Elite Paradise.");
  const settings = trpc.catalog.settings.useQuery();
  const s = settings.data;
  const wa = (s?.whatsappNumber ?? "").replace(/[^0-9]/g, "");

  return (
    <>
      <PageHero
        eyebrow="Customer care"
        title="Contact Us"
        intro="Questions about a piece, an order, or a repair — we answer them ourselves."
      />

      <div className="ep-shell py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          <div>
            <h2 className="ep-display ep-h3 mb-6">Reach us</h2>
            <ul className="space-y-5 text-[14px]">
              {s?.contactEmail && (
                <li>
                  <p className="ep-eyebrow text-[8px] mb-1">Email</p>
                  <a href={`mailto:${s.contactEmail}`} className="text-ink hover:text-gold-deep transition-colors">
                    {s.contactEmail}
                  </a>
                </li>
              )}
              {s?.contactPhone && (
                <li>
                  <p className="ep-eyebrow text-[8px] mb-1">Phone</p>
                  <a href={`tel:${s.contactPhone.replace(/\s/g, "")}`} className="text-ink hover:text-gold-deep transition-colors">
                    {s.contactPhone}
                  </a>
                </li>
              )}
              {wa && (
                <li>
                  <p className="ep-eyebrow text-[8px] mb-1">WhatsApp</p>
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-ink hover:text-gold-deep transition-colors"
                  >
                    <IconWhatsApp className="w-4 h-4" />
                    Message us
                  </a>
                </li>
              )}
              {s?.address && (
                <li>
                  <p className="ep-eyebrow text-[8px] mb-1">Studio</p>
                  <p className="text-ink/80 leading-relaxed">{s.address}</p>
                </li>
              )}
            </ul>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="ep-eyebrow text-[8px] mb-2">Hours</p>
              <p className="text-[13.5px] text-ink/80">
                Saturday – Thursday, 10:00 – 19:00 (GMT+6). Closed Friday.
              </p>
            </div>
          </div>

          <div className="bg-white border border-border p-6 md:p-8">
            <h2 className="ep-display ep-h3 mb-2">Before you write</h2>
            <p className="ep-body text-[13.5px] mb-6">
              Most questions are answered below — it is usually faster than waiting for a reply.
            </p>
            <ul className="space-y-3 text-[13.5px]">
              {[
                ["How long does delivery take?", "/shipping"],
                ["Can I return a piece?", "/returns"],
                ["How do I look after it?", "/care-guide"],
                ["Where is my order?", "/track-order"],
                ["Common questions", "/faq"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-ink hover:text-gold-deep transition-colors underline decoration-border underline-offset-4">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

// ── FAQ ──────────────────────────────────────────────────────────────────────

export function Faq() {
  usePageMeta("FAQ — Elite Paradise", "Answers to common questions about ordering from Elite Paradise.");

  return (
    <>
      <PageHero eyebrow="Help" title="Frequently Asked Questions" />
      <div className="ep-shell-narrow py-14 md:py-20">
        <Accordion
          defaultOpen={0}
          items={[
            {
              title: "How do I place an order?",
              body: (
                <p>
                  Add a piece to your bag, then go to checkout and enter your delivery details. You
                  will receive an order number immediately. We then contact you to confirm and
                  arrange payment.
                </p>
              ),
            },
            {
              title: "What payment methods do you accept?",
              body: (
                <p>
                  Cash on delivery, bKash, Nagad and card. No payment is taken on this site — we
                  contact you after your order is placed to complete it. Nothing is charged
                  automatically.
                </p>
              ),
            },
            {
              title: "How long does delivery take?",
              body: (
                <p>
                  Inside Dhaka, usually 1–2 working days. Elsewhere in Bangladesh, 2–4 working days.
                  Delivery is complimentary on orders over ৳5,000.
                </p>
              ),
            },
            {
              title: "Can I return or exchange a piece?",
              body: (
                <p>
                  Yes — unworn pieces in their original packaging within 14 days of delivery.
                  Earrings are excluded for hygiene reasons. See our{" "}
                  <Link href="/returns" className="underline">
                    return policy
                  </Link>
                  .
                </p>
              ),
            },
            {
              title: "Is the jewelry waterproof?",
              body: (
                <p>
                  No. Gold vermeil and plated pieces should be removed before showering, swimming or
                  applying perfume. Our{" "}
                  <Link href="/care-guide" className="underline">
                    care guide
                  </Link>{" "}
                  explains what each material needs.
                </p>
              ),
            },
            {
              title: "Do you offer engraving?",
              body: (
                <p>
                  Not through this site. Contact us before ordering and we will tell you whether a
                  particular piece can be engraved and what it costs.
                </p>
              ),
            },
            {
              title: "How do I find my ring size?",
              body: (
                <p>
                  Measure the inside diameter of a ring that already fits, in millimetres, and
                  compare it with the size list on the product page. If you are between sizes, take
                  the larger one.
                </p>
              ),
            },
            {
              title: "Can I change or cancel an order?",
              body: (
                <p>
                  Contact us as soon as possible with your order number. If it has not shipped we
                  can usually change or cancel it.
                </p>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}

// ── Care guide ───────────────────────────────────────────────────────────────

export function CareGuide() {
  usePageMeta("Jewelry Care Guide — Elite Paradise", "How to look after gold vermeil, sterling silver, pearls and plated steel.");

  return (
    <>
      <PageHero
        eyebrow="Care"
        title="Jewelry Care Guide"
        intro="A piece looked after properly will outlast the fashion that made it."
        image={EDITORIAL.necklace}
      />
      <Prose>
        <H2>18k gold vermeil</H2>
        <p>
          Vermeil is a thick layer of gold over sterling silver. It is durable but not indestructible.
          Remove it before showering, swimming, or applying perfume and lotion — the oils and
          chemicals dull the gold faster than wear does. Wipe with the soft cloth after each wear and
          store it in the pouch provided, away from direct sunlight.
        </p>

        <H2>Sterling silver</H2>
        <p>
          Silver tarnishes naturally; that is not a fault. A gentle polish with the soft cloth
          restores it. Keep it dry and away from household cleaners, and never use silver dip on a
          piece set with pearls.
        </p>

        <H2>Freshwater pearls</H2>
        <p>
          Pearls are soft and porous. Perfume, hairspray and cosmetics will mark them permanently, so
          put jewelry on last and take it off first. Wipe with a damp soft cloth, never a polishing
          cloth, and store flat — hanging stretches the thread.
        </p>

        <H2>Gold-plated stainless steel</H2>
        <p>
          The steel underneath is tough; the plating is what wears. Avoid chlorine and abrasive
          cleaners, and do not scrub. Wipe dry after contact with water.
        </p>

        <H2>Watches</H2>
        <p>
          Keep the case dry, avoid magnets and knocks, and have the battery replaced by a jeweller
          rather than opening the case yourself. Our watches are not waterproof.
        </p>

        <H2>Storing</H2>
        <p>
          Store pieces separately so they do not scratch each other, in the pouch or box provided,
          somewhere dry and out of direct sunlight. A bathroom is the worst place for jewelry.
        </p>
      </Prose>
    </>
  );
}

// ── Shipping ─────────────────────────────────────────────────────────────────

export function Shipping() {
  usePageMeta("Shipping Information — Elite Paradise", "Delivery times and charges across Bangladesh.");
  const settings = trpc.catalog.settings.useQuery();
  const charge = settings.data?.deliveryCharge ?? 120;
  const free = settings.data?.freeDeliveryThreshold ?? 5000;

  return (
    <>
      <PageHero eyebrow="Delivery" title="Shipping Information" />
      <Prose>
        <H2>Where we deliver</H2>
        <p>Everywhere in Bangladesh, by courier, to the address you give at checkout.</p>

        <H2>Charges</H2>
        <p>
          Delivery is ৳{charge.toLocaleString("en-US")} per order, and complimentary on orders over
          ৳{free.toLocaleString("en-US")} after any discount.
        </p>

        <H2>Times</H2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Inside Dhaka: 1–2 working days after we confirm your order.</li>
          <li>Elsewhere in Bangladesh: 2–4 working days.</li>
          <li>Remote areas may take one or two days longer.</li>
        </ul>

        <H2>Tracking</H2>
        <p>
          You can check the status of any order with its number and the email you used at checkout,
          on the{" "}
          <Link href="/track-order" className="underline">
            track your order
          </Link>{" "}
          page. If you have an account, your orders are listed there too.
        </p>

        <H2>Packaging</H2>
        <p>
          Every order arrives in our ivory presentation box with a champagne-gold ribbon, packed so
          that nothing moves in transit.
        </p>
      </Prose>
    </>
  );
}

// ── Returns ──────────────────────────────────────────────────────────────────

export function Returns() {
  usePageMeta("Returns & Refunds — Elite Paradise", "Our 14-day return policy.");

  return (
    <>
      <PageHero eyebrow="After your order" title="Returns & Refunds" />
      <Prose>
        <H2>The window</H2>
        <p>
          You may return an unworn piece within 14 days of delivery, in its original packaging with
          the box and pouch intact.
        </p>

        <H2>What cannot be returned</H2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Earrings, for hygiene reasons.</li>
          <li>Engraved or otherwise personalised pieces.</li>
          <li>Pieces showing signs of wear, or returned without their packaging.</li>
        </ul>

        <H2>How to start a return</H2>
        <p>
          Contact us with your order number and the reason for the return. We will confirm whether
          it qualifies and tell you where to send it. Please do not send anything back before we
          have replied.
        </p>

        <H2>Refunds</H2>
        <p>
          Once the piece is received and checked, we refund the amount paid for it. Delivery charges
          are refunded only where the item was faulty or the wrong piece was sent. Refunds are made
          by the same method you paid with.
        </p>

        <H2>Faulty pieces</H2>
        <p>
          If something arrives damaged or fails in normal wear, contact us with photographs. We will
          repair, replace or refund it — whichever is right for the piece.
        </p>
      </Prose>
    </>
  );
}

// ── Privacy ──────────────────────────────────────────────────────────────────

export function Privacy() {
  usePageMeta("Privacy Policy — Elite Paradise", "What we collect and how we use it.");

  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" />
      <Prose>
        <H2>What we collect</H2>
        <p>
          When you place an order we collect your name, phone number, email address and delivery
          address. If you create an account we also store your email and a securely hashed password.
          If you subscribe to our newsletter we store your email address.
        </p>

        <H2>Why we collect it</H2>
        <p>
          To fulfil and deliver your order, to answer your questions, and — only if you asked for it —
          to send occasional updates about new pieces.
        </p>

        <H2>Who sees it</H2>
        <p>
          Our own staff, and the courier who delivers your order. We do not sell your data, and we do
          not share it with advertisers.
        </p>

        <H2>How long we keep it</H2>
        <p>
          Order records are kept for as long as we need them for accounting and returns. Newsletter
          addresses are kept until you ask to be removed.
        </p>

        <H2>Your choices</H2>
        <p>
          You can ask us for a copy of what we hold about you, ask us to correct it, or ask us to
          delete it. Contact us and we will do it.
        </p>

        <H2>Cookies</H2>
        <p>
          We use a session cookie to keep you signed in, and your browser's local storage to remember
          your bag and wishlist. We do not use advertising or tracking cookies.
        </p>
      </Prose>
    </>
  );
}

// ── Terms ────────────────────────────────────────────────────────────────────

export function Terms() {
  usePageMeta("Terms & Conditions — Elite Paradise", "The terms on which we sell.");

  return (
    <>
      <PageHero eyebrow="Legal" title="Terms & Conditions" />
      <Prose>
        <H2>Orders</H2>
        <p>
          Placing an order is an offer to buy. It is accepted when we confirm it with you. Prices are
          in Bangladeshi Taka and include no delivery charge unless stated.
        </p>

        <H2>Payment</H2>
        <p>
          No payment is taken on this site. We contact you after your order is placed to arrange
          payment by cash on delivery, bKash, Nagad or card. An order is not dispatched until payment
          is arranged.
        </p>

        <H2>Availability</H2>
        <p>
          Stock is limited and pieces are made in small numbers. If something you ordered is no
          longer available we will tell you and refund anything already paid.
        </p>

        <H2>Product descriptions</H2>
        <p>
          We describe materials, weights and sizes as accurately as we can. Photographs are of the
          actual pieces, though screens vary in how they show colour.
        </p>

        <H2>Returns</H2>
        <p>
          Returns are governed by our{" "}
          <Link href="/returns" className="underline">
            return policy
          </Link>
          .
        </p>

        <H2>Liability</H2>
        <p>
          We are responsible for the piece arriving as described. We are not responsible for damage
          caused by wear contrary to our{" "}
          <Link href="/care-guide" className="underline">
            care guide
          </Link>
          .
        </p>
      </Prose>
    </>
  );
}

// ── Not found ────────────────────────────────────────────────────────────────

export function NotFound() {
  usePageMeta("Page not found — Elite Paradise", "That page does not exist.");
  return (
    <div className="bg-ivory min-h-[60vh] flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        <Link href="/" aria-label="Elite Paradise — home" className="inline-block mb-8">
          <Wordmark size="lg" tagline />
        </Link>
        <p className="ep-eyebrow mb-4">404</p>
        <h1 className="ep-display ep-h2 mb-4">This page has moved on.</h1>
        <p className="ep-body mb-8">
          The link may be old, or the piece may no longer be in the collection.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="ep-btn ep-btn-solid">
            Back to home
          </Link>
          <Link href="/collections/shop-all" className="ep-btn ep-btn-ghost">
            Shop all
          </Link>
        </div>
      </div>
    </div>
  );
}
