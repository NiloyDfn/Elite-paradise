// Small shared hooks: reveal-on-scroll, body lock, escape, debounce, page meta.
import { useEffect, useRef, useState } from "react";

/** Adds `is-visible` once the element scrolls into view. */
export function useReveal<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    // Safety net: if the observer never fires (very tall viewport, print,
    // reduced-motion quirks), reveal anyway so content is never stuck hidden.
    const fallback = setTimeout(() => el.classList.add("is-in"), 1200);
    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, [threshold]);
  return ref;
}

/** Locks body scroll while an overlay is open. */
export function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

/** Calls `fn` on Escape, only while `active`. */
export function useEscape(fn: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") fn();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [fn, active]);
}

/** Debounces a value. */
export function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Sets document title and meta description for a page. */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (description) {
      let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = "description";
        document.head.appendChild(tag);
      }
      tag.content = description;
    }
    // Keep the social cards in step with the page, so a shared product link
    // previews the product rather than the site default.
    const setOg = (prop: string, value: string) => {
      let tag = document.querySelector<HTMLMetaElement>(`meta[property="${prop}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", prop);
        document.head.appendChild(tag);
      }
      tag.content = value;
    };
    setOg("og:title", title);
    if (description) setOg("og:description", description);
  }, [title, description]);
}

/**
 * Injects a JSON-LD block for the current page and removes it on unmount.
 * Used for Product and Breadcrumb structured data — the markup Google reads to
 * show price and availability in a result.
 */
export function useJsonLd(data: unknown | null) {
  useEffect(() => {
    if (!data) return;
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.dataset.pageLd = "1";
    el.textContent = JSON.stringify(data);
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, [data]);
}
