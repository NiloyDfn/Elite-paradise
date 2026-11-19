// Sticky luxury header: announcement bar, split nav, mega menus, mobile drawer.
import { useSiteImages } from "../lib/siteImages";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { NAV } from "@shared/catalog";
import { useCart } from "../lib/cart";
import { useBodyLock, useEscape } from "../lib/hooks";
import {
  IconBag,
  IconChevron,
  IconClose,
  IconHeart,
  IconSearch,
  IconUser,
  Wordmark,
} from "./shared";
import { useAuth } from "@/_core/useAuth";
import { SearchOverlay } from "./SearchOverlay";

export function Header({
  announcement,
  onOpenCart,
}: {
  announcement: string | null;
  onOpenCart: () => void;
}) {
  const [location] = useLocation();
  const { count } = useCart();
  const { user } = useAuth();
  const img = useSiteImages();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useBodyLock(mobileOpen);
  useEscape(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, mobileOpen || !!openMenu);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close overlays on navigation.
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [location]);

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <>
      {/* Announcement bar — editable in Admin → Website */}
      {announcement && (
        <div className="ep-announce overflow-hidden">
          <div className="ep-shell py-2 flex items-center justify-center">
            <p className="text-[10px] tracking-[0.26em] uppercase text-center">{announcement}</p>
          </div>
        </div>
      )}

      <header
        className={`ep-nav sticky top-0 z-50 transition-shadow duration-300 ${
          scrolled ? "shadow-[0_10px_30px_-22px_rgba(25,25,25,0.35)]" : ""
        }`}
        onMouseLeave={() => {
          // Mouse users: closing on leave is natural. On touch screens the page
          // scrim (tap anywhere outside) closes it instead.
          if (!window.matchMedia("(hover: none)").matches) setOpenMenu(null);
        }}
      >
        <div className="ep-shell">
          {/* One layout at every width. Below xl the outer columns are `auto`
              so the wordmark and icons hug the edges. From xl the outer columns
              become equal `1fr`, which centres the nav on the page exactly —
              the wordmark and icon groups can differ in width without pulling
              the menu off-centre. A grid means the three groups can never
              overlap, at any viewport width. */}
          <div className="grid grid-cols-[auto_1fr_auto] xl:grid-cols-[1fr_auto_1fr] items-center h-[68px] md:h-[84px] gap-3 xl:gap-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                className="xl:hidden -ml-1 p-1.5 text-ink shrink-0"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
                  <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
                </svg>
              </button>

              {/* The icon group is wider than the wordmark, so a page-centred
                  nav would leave visibly more air on the left than the right.
                  The right padding extends this link's box (not the text, which
                  stays flush with the page edge) to even the two gaps out. */}
              <Link
                href="/"
                className="shrink-0 px-1 xl:pr-14 2xl:pr-[77px]"
                aria-label="Elite Paradise — home"
              >
                <Wordmark size="md" tagline={false} />
              </Link>
            </div>

            <nav
              className="hidden xl:flex items-center justify-center gap-3 2xl:gap-5 min-w-0"
              aria-label="Main"
            >
                {NAV.map((item) => (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => {
                      // Hover opens the menu for mouse users only; touch screens use tap (below).
                      if (!window.matchMedia("(hover: none)").matches) setOpenMenu(item.menu ? item.label : null);
                    }}
                  >
                    <Link
                      href={item.href}
                      className={`inline-flex items-center gap-1 py-2 text-[9.5px] 2xl:text-[10px] font-medium tracking-[0.1em] 2xl:tracking-[0.14em] uppercase whitespace-nowrap transition-colors ${
                        isActive(item.href) ? "text-gold-deep" : "text-ink hover:text-gold-deep"
                      }`}
                      onClick={(e) => {
                        // On touch screens there is no hover: first tap opens the menu,
                        // second tap follows the link.
                        if (item.menu && openMenu !== item.label && window.matchMedia("(hover: none)").matches) {
                          e.preventDefault();
                          setOpenMenu(item.label);
                        }
                      }}
                      aria-haspopup={item.menu ? "true" : undefined}
                      aria-expanded={item.menu ? openMenu === item.label : undefined}
                    >
                      {item.label}
                      {item.menu && <IconChevron className="w-2.5 h-2.5 opacity-50" />}
                    </Link>
                  </div>
                ))}
            </nav>

            {/* Right: icons */}
            <div className="flex items-center justify-end gap-1 md:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="p-2.5 text-ink hover:text-gold-deep transition-colors"
              >
                <IconSearch />
              </button>
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="hidden sm:inline-block mr-1 px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase border border-gold text-gold-deep hover:bg-gold hover:text-night transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                href={user ? "/account" : "/login"}
                aria-label={user ? "Your account" : "Sign in"}
                className="p-2.5 text-ink hover:text-gold-deep transition-colors hidden sm:block"
              >
                <IconUser />
              </Link>
              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className="p-2.5 text-ink hover:text-gold-deep transition-colors hidden sm:block"
              >
                <IconHeart />
              </Link>
              <button
                type="button"
                onClick={onOpenCart}
                aria-label={`Shopping bag, ${count} ${count === 1 ? "item" : "items"}`}
                className="relative p-2.5 text-ink hover:text-gold-deep transition-colors"
              >
                <IconBag />
                {count > 0 && (
                  <span className="absolute top-1 right-0.5 min-w-[15px] h-[15px] px-1 flex items-center justify-center bg-gold text-ink text-[9px] font-semibold rounded-full tabular-nums">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mega menu panel */}
        {NAV.map((item) =>
          item.menu && openMenu === item.label ? (
            <div
              key={item.label}
              className="ep-mega hidden md:block absolute inset-x-0 top-full"
            >
              <div className="ep-shell py-10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8">
                  {item.menu.map((group) => (
                    <div key={group.title}>
                      <p className="ep-eyebrow mb-4">{group.title}</p>
                      <ul className="space-y-2.5">
                        {group.links.map((l) => (
                          <li key={l.href}>
                            <Link
                              href={l.href}
                              className="text-[13px] text-ink/80 hover:text-gold-deep transition-colors"
                            >
                              {l.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="hidden lg:block">
                    <Link href={item.href} className="group block">
                      <div className="aspect-[4/3] overflow-hidden bg-muted">
                        <img
                          src={img(MEGA_KEY[item.label] ?? "mega-default")}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <p className="ep-link mt-4">Explore {item.label}</p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null,
        )}
      </header>

      {/* Soft scrim under the header while a mega menu is open. Clicking it closes the menu. */}
      {openMenu && (
        <div
          className="hidden md:block fixed inset-0 z-40 bg-night/60 animate-[ep-fade_0.2s_ease-out]"
          onClick={() => setOpenMenu(null)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="ep-scrim-glass xl:hidden" onClick={() => setMobileOpen(false)} />
          <div
            className="ep-glass-drawer-left fixed inset-y-0 left-0 z-[70] w-[86%] max-w-[380px] flex flex-col xl:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between px-5 h-[68px] border-b border-border">
              <Link href="/" aria-label="Elite Paradise — home" onClick={() => setMobileOpen(false)}>
                <Wordmark size="sm" tagline={false} />
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="p-2 -mr-2 text-ink"
              >
                <IconClose />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 py-6" aria-label="Mobile">
              {NAV.map((item) => (
                <MobileNavItem key={item.label} item={item} />
              ))}
              <div className="mt-8 pt-6 border-t border-border space-y-3">
                <Link href={user ? "/account" : "/login"} className="block text-[12px] tracking-[0.14em] uppercase text-ink">
                  {user ? "My account" : "Sign in"}
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin" className="block text-[12px] tracking-[0.14em] uppercase text-gold-deep">
                    Admin panel
                  </Link>
                )}
                <Link href="/wishlist" className="block text-[12px] tracking-[0.14em] uppercase text-ink">
                  Wishlist
                </Link>
                <Link href="/track-order" className="block text-[12px] tracking-[0.14em] uppercase text-ink">
                  Track your order
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

const MEGA_KEY: Record<string, string> = {
  Women: "mega-women",
  Men: "mega-men",
  "Couple Collection": "mega-couple",
  Gifts: "mega-gifts",
  "Shop All": "mega-default",
};

function MobileNavItem({ item }: { item: (typeof NAV)[number] }) {
  const [open, setOpen] = useState(false);
  if (!item.menu) {
    return (
      <Link
        href={item.href}
        className="block py-3.5 border-b border-border text-[12px] tracking-[0.16em] uppercase text-ink"
      >
        {item.label}
      </Link>
    );
  }
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-3.5 text-[12px] tracking-[0.16em] uppercase text-ink"
      >
        {item.label}
        <IconChevron className={`w-3.5 h-3.5 text-grey transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="pb-4 pl-1 space-y-4">
          {item.menu.map((g) => (
            <div key={g.title}>
              <p className="ep-eyebrow mb-2 text-[9px]">{g.title}</p>
              <ul className="space-y-2">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[13px] text-ink/75">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
