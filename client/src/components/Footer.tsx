// Footer + floating WhatsApp button.
import { Link } from "wouter";
import { IconWhatsApp, Wordmark } from "./shared";

export type FooterSettings = {
  whatsappNumber: string | null;
  instagram: string | null;
  facebook: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
};

export function Footer({ settings }: { settings: FooterSettings }) {
  const year = new Date().getFullYear();
  const wa = (settings.whatsappNumber ?? "").replace(/[^0-9]/g, "");

  return (
    <footer className="bg-night text-cream/80">
      <div className="ep-shell pt-16 pb-10 md:pt-20">
        <div className="grid gap-12 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link href="/" aria-label="Elite Paradise — home" className="inline-block text-cream">
              <Wordmark size="lg" onDark />
            </Link>
            <p className="mt-6 text-[13px] leading-relaxed text-cream/60 max-w-xs">
              Considered jewelry and accessories, made to be worn every day and kept for years.
            </p>
            <div className="mt-6 flex items-center gap-4">
              {settings.instagram && (
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-cream/60 hover:text-gold transition-colors"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              )}
              {settings.facebook && (
                <a
                  href={settings.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-cream/60 hover:text-gold transition-colors"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.29-.04-1.27-.12-2.41-.12-2.39 0-4.02 1.46-4.02 4.13v2.29H7.5V13h2.77v8h3.23z" />
                  </svg>
                </a>
              )}
              {wa && (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="text-cream/60 hover:text-gold transition-colors"
                >
                  <IconWhatsApp className="w-[17px] h-[17px]" />
                </a>
              )}
            </div>
          </div>

          {/* Shop */}
          <div className="md:col-span-2">
            <p className="text-[9px] tracking-[0.24em] uppercase text-cream/40 mb-4">Shop</p>
            <ul className="space-y-2.5 text-[13px]">
              {[
                ["New Arrivals", "/collections/new-arrivals"],
                ["Shop All", "/collections/shop-all"],
                ["Women", "/collections/women"],
                ["Men", "/collections/men"],
                ["Couple Collection", "/collections/couple"],
                ["Gifts", "/collections/gifts"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-gold transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-3">
            <p className="text-[9px] tracking-[0.24em] uppercase text-cream/40 mb-4">Customer care</p>
            <ul className="space-y-2.5 text-[13px]">
              {[
                ["Contact Us", "/contact"],
                ["FAQ", "/faq"],
                ["Jewelry Care Guide", "/care-guide"],
                ["Shipping Information", "/shipping"],
                ["Returns & Refunds", "/returns"],
                ["Track Your Order", "/track-order"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-gold transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-3">
            <p className="text-[9px] tracking-[0.24em] uppercase text-cream/40 mb-4">Contact</p>
            <ul className="space-y-2.5 text-[13px]">
              {settings.contactEmail && (
                <li>
                  <a href={`mailto:${settings.contactEmail}`} className="hover:text-gold transition-colors">
                    {settings.contactEmail}
                  </a>
                </li>
              )}
              {settings.contactPhone && (
                <li>
                  <a
                    href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
                    className="hover:text-gold transition-colors"
                  >
                    {settings.contactPhone}
                  </a>
                </li>
              )}
              {settings.address && (
                <li className="text-cream/50 leading-relaxed">{settings.address}</li>
              )}
            </ul>
            <ul className="mt-5 space-y-2.5 text-[13px]">
              <li>
                <Link href="/about" className="hover:text-gold transition-colors">
                  About Elite Paradise
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-gold transition-colors">
                  Staff login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-cream/12 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-cream/40">
            © {year} Elite Paradise. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-cream/40">
            {[
              ["Privacy Policy", "/privacy"],
              ["Terms & Conditions", "/terms"],
              ["Shipping Policy", "/shipping"],
              ["Return Policy", "/returns"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="hover:text-cream/70 transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

/** Floating WhatsApp button. The number is a placeholder until the real one is
 *  set in Admin → Website. */
export function WhatsAppFab({ number }: { number: string | null }) {
  const wa = (number ?? "").replace(/[^0-9]/g, "");
  if (!wa) return null;
  return (
    <a
      href={`https://wa.me/${wa}?text=${encodeURIComponent("Hello Elite Paradise, I would like to ask about a piece.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-24 right-5 z-40 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 transition-transform"
    >
      <IconWhatsApp className="w-6 h-6 md:w-7 md:h-7" />
    </a>
  );
}
